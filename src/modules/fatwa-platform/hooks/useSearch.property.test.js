import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import Fuse from 'fuse.js'

/**
 * Test helper: Creates a Fuse instance with the same options as the useSearch hook.
 * This allows synchronous testing of the search logic without React hooks or debounce.
 */
const FUSE_OPTIONS = {
  threshold: 0.4,
  distance: 100,
  includeScore: true,
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'question_text', weight: 0.3 },
    { name: 'response_text', weight: 0.2 },
    { name: 'category_1', weight: 0.1 },
    { name: 'reference_number', weight: 0.05 },
    { name: 'dar_ul_ifta', weight: 0.05 },
    { name: 'category_2', weight: 0.05 },
    { name: 'category_3', weight: 0.05 },
  ],
}

/**
 * Creates a Fuse instance and performs a search, returning results.
 */
function searchFatwas(fatwas, query) {
  const fuse = new Fuse(fatwas, FUSE_OPTIONS)
  return fuse.search(query)
}

/**
 * Applies category_1 or dar_ul_ifta filters to Fuse search results.
 */
function filterResults(results, { category_1, dar_ul_ifta } = {}) {
  let filtered = results
  if (category_1) {
    filtered = filtered.filter((r) => r.item.category_1 === category_1)
  }
  if (dar_ul_ifta) {
    filtered = filtered.filter((r) => r.item.dar_ul_ifta === dar_ul_ifta)
  }
  return filtered
}

/**
 * Generates autocomplete suggestions (top N titles) from search results.
 */
function getSuggestions(results, limit = 5) {
  return results.slice(0, limit).map((r) => ({
    title: r.item.title,
    slug: r.item.slug,
    id: r.item.id,
  }))
}

// --- Generators ---

/** Generates a simple alphanumeric term of specified min length */
const alphanumTerm = (minLen = 4, maxLen = 12) =>
  fc.stringMatching(new RegExp(`^[a-z]{${minLen},${maxLen}}$`))

/** Generates a fatwa object with all searchable fields */
const fatwaArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 3, maxLength: 60 }),
  question_text: fc.string({ minLength: 3, maxLength: 100 }),
  response_text: fc.string({ minLength: 3, maxLength: 100 }),
  reference_number: fc.stringMatching(/^HDF-\d{4}-\d{3}$/),
  dar_ul_ifta: fc.constantFrom('Hidayat Darul Ifta', 'Darul Uloom Karachi', 'Jamia Ashrafia'),
  category_1: fc.constantFrom('Worship', 'Business', 'Family', 'Ethics'),
  category_2: fc.constantFrom('Prayer', 'Fasting', 'Trade', 'Marriage'),
  category_3: fc.constantFrom('Missed Prayers', 'Ramadan', 'Interest', 'Divorce'),
  slug: fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+){1,4}$/),
})

/**
 * Feature: fatwa-knowledge-platform
 * Property 11: Search Multi-Field Matching
 *
 * For any term that exists in a fatwa's title, question_text, response_text,
 * reference_number, dar_ul_ifta, or category fields, searching for that exact
 * term SHALL include that fatwa in the results.
 *
 * Validates: Requirements 9.1
 */
describe('Feature: fatwa-knowledge-platform, Property 11: Search Multi-Field Matching', () => {
  it('exact term in any searchable field returns that fatwa in results', () => {
    // Generate a unique marker term that will only exist in our target fatwa
    const markerTerm = alphanumTerm(5, 10)

    // Pick which field to inject the marker into
    const fieldArb = fc.constantFrom(
      'title',
      'question_text',
      'response_text',
      'reference_number',
      'dar_ul_ifta',
      'category_1'
    )

    fc.assert(
      fc.property(markerTerm, fieldArb, fatwaArb, (marker, field, baseFatwa) => {
        // Create target fatwa with the marker injected into the chosen field
        const targetFatwa = {
          ...baseFatwa,
          [field]: marker,
        }

        // Create a small dataset with some other fatwas that don't contain the marker
        const otherFatwas = [
          { ...baseFatwa, id: 'other-1', title: 'unrelated content alpha', question_text: 'something else', response_text: 'different text' },
          { ...baseFatwa, id: 'other-2', title: 'another unrelated beta', question_text: 'no match here', response_text: 'nothing similar' },
        ]

        const dataset = [targetFatwa, ...otherFatwas]
        const results = searchFatwas(dataset, marker)

        // The target fatwa should appear in results
        const foundIds = results.map((r) => r.item.id)
        expect(foundIds).toContain(targetFatwa.id)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: fatwa-knowledge-platform
 * Property 12: Search Typo Tolerance
 *
 * For any term of 4+ characters that exists in the fatwa dataset, introducing
 * a single character substitution, insertion, or deletion SHALL still return
 * the original matching fatwa in the results.
 *
 * Validates: Requirements 9.4
 */
describe('Feature: fatwa-knowledge-platform, Property 12: Search Typo Tolerance', () => {
  it('single char edit on 4+ char term still matches the original fatwa', () => {
    // Generate a term of 4+ lowercase chars to use as the fatwa title
    const termArb = alphanumTerm(5, 10)

    // Type of typo to introduce
    const typoTypeArb = fc.constantFrom('substitution', 'insertion', 'deletion')

    fc.assert(
      fc.property(termArb, typoTypeArb, fc.nat(), fatwaArb, (term, typoType, positionSeed, baseFatwa) => {
        // Create a fatwa with the term as its title
        const targetFatwa = {
          ...baseFatwa,
          title: term,
        }

        // Introduce a single-character typo
        const position = positionSeed % term.length
        let typoTerm

        if (typoType === 'substitution') {
          // Replace one char with a different char
          const chars = 'abcdefghijklmnopqrstuvwxyz'
          let replacement = chars[positionSeed % chars.length]
          if (replacement === term[position]) {
            replacement = chars[(positionSeed + 1) % chars.length]
          }
          typoTerm = term.slice(0, position) + replacement + term.slice(position + 1)
        } else if (typoType === 'insertion') {
          // Insert an extra char
          const chars = 'abcdefghijklmnopqrstuvwxyz'
          const inserted = chars[positionSeed % chars.length]
          typoTerm = term.slice(0, position) + inserted + term.slice(position)
        } else {
          // Delete one char
          typoTerm = term.slice(0, position) + term.slice(position + 1)
          // Ensure we still have a non-empty query
          if (typoTerm.length === 0) typoTerm = term.slice(1)
        }

        // Ensure the typo actually changed the term
        fc.pre(typoTerm !== term)
        fc.pre(typoTerm.length >= 3)

        // Create dataset
        const dataset = [
          targetFatwa,
          { ...baseFatwa, id: 'other-1', title: 'completely unrelated xyz' },
        ]

        const results = searchFatwas(dataset, typoTerm)
        const foundIds = results.map((r) => r.item.id)

        // The original fatwa should still be found despite the typo
        expect(foundIds).toContain(targetFatwa.id)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: fatwa-knowledge-platform
 * Property 13: Search Filter Correctness
 *
 * For any search query with an active category_1 or dar_ul_ifta filter,
 * every result in the filtered output SHALL match the specified filter value.
 *
 * Validates: Requirements 9.7
 */
describe('Feature: fatwa-knowledge-platform, Property 13: Search Filter Correctness', () => {
  it('filtered results all match the category_1 filter value', () => {
    const categoryArb = fc.constantFrom('Worship', 'Business', 'Family', 'Ethics')
    const queryArb = alphanumTerm(3, 8)

    fc.assert(
      fc.property(
        queryArb,
        categoryArb,
        fc.array(fatwaArb, { minLength: 3, maxLength: 10 }),
        (query, filterCategory, fatwas) => {
          // Ensure at least one fatwa has the query in its title and matches the filter
          const targetFatwa = {
            ...fatwas[0],
            title: query,
            category_1: filterCategory,
          }
          const dataset = [targetFatwa, ...fatwas.slice(1)]

          const results = searchFatwas(dataset, query)
          const filtered = filterResults(results, { category_1: filterCategory })

          // Every filtered result must match the filter value
          for (const result of filtered) {
            expect(result.item.category_1).toBe(filterCategory)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('filtered results all match the dar_ul_ifta filter value', () => {
    const iftaArb = fc.constantFrom('Hidayat Darul Ifta', 'Darul Uloom Karachi', 'Jamia Ashrafia')
    const queryArb = alphanumTerm(3, 8)

    fc.assert(
      fc.property(
        queryArb,
        iftaArb,
        fc.array(fatwaArb, { minLength: 3, maxLength: 10 }),
        (query, filterIfta, fatwas) => {
          // Ensure at least one fatwa has the query in its title and matches the filter
          const targetFatwa = {
            ...fatwas[0],
            title: query,
            dar_ul_ifta: filterIfta,
          }
          const dataset = [targetFatwa, ...fatwas.slice(1)]

          const results = searchFatwas(dataset, query)
          const filtered = filterResults(results, { dar_ul_ifta: filterIfta })

          // Every filtered result must match the filter value
          for (const result of filtered) {
            expect(result.item.dar_ul_ifta).toBe(filterIfta)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: fatwa-knowledge-platform
 * Property 14: Autocomplete Suggestion Cap
 *
 * For any search query regardless of dataset size, the autocomplete suggestions
 * list SHALL contain at most 5 items.
 *
 * Validates: Requirements 9.6
 */
describe('Feature: fatwa-knowledge-platform, Property 14: Autocomplete Suggestion Cap', () => {
  it('suggestions list is always <= 5 items regardless of dataset size', () => {
    const queryArb = alphanumTerm(3, 8)

    fc.assert(
      fc.property(
        queryArb,
        fc.array(fatwaArb, { minLength: 1, maxLength: 30 }),
        (query, fatwas) => {
          // Inject the query into multiple fatwas to ensure many matches
          const dataset = fatwas.map((f, i) => ({
            ...f,
            title: `${query} fatwa number ${i}`,
          }))

          const results = searchFatwas(dataset, query)
          const suggestions = getSuggestions(results, 5)

          // Suggestions must never exceed 5
          expect(suggestions.length).toBeLessThanOrEqual(5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('suggestions list is always <= 5 items even with large datasets', () => {
    const queryArb = alphanumTerm(3, 8)

    fc.assert(
      fc.property(
        queryArb,
        fc.array(fatwaArb, { minLength: 10, maxLength: 50 }),
        (query, fatwas) => {
          // Make all fatwas match by putting query in title
          const dataset = fatwas.map((f, i) => ({
            ...f,
            title: `${query} topic ${i} discussion`,
          }))

          const results = searchFatwas(dataset, query)
          const suggestions = getSuggestions(results, 5)

          expect(suggestions.length).toBeLessThanOrEqual(5)
        }
      ),
      { numRuns: 100 }
    )
  })
})
