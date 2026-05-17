import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getRelatedFatwas } from './relatedFatwas.js'

/**
 * Feature: fatwa-knowledge-platform, Property 10: Related Fatwas Engine
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */
describe('Property 10: Related Fatwas Engine', () => {
  // Generator for a fatwa record with id and category fields
  const fatwaArb = (idPrefix) =>
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 10 }).map((s) => `${idPrefix}-${s}`),
      category_1: fc.constantFrom('Worship', 'Finance', 'Family', 'Ethics'),
      category_2: fc.constantFrom('Prayer', 'Fasting', 'Zakat', 'Banking', 'Marriage', 'Divorce'),
      category_3: fc.constantFrom('Missed', 'Congregation', 'Taraweeh', 'Interest', 'Mahr', 'Iddah'),
    })

  // Generator for a current fatwa with a fixed id to avoid collisions
  const currentFatwaArb = fc.record({
    id: fc.constant('current-fatwa'),
    category_1: fc.constantFrom('Worship', 'Finance', 'Family', 'Ethics'),
    category_2: fc.constantFrom('Prayer', 'Fasting', 'Zakat', 'Banking', 'Marriage', 'Divorce'),
    category_3: fc.constantFrom('Missed', 'Congregation', 'Taraweeh', 'Interest', 'Mahr', 'Iddah'),
  })

  // Generator for an array of other fatwas with various category combinations
  const otherFatwasArb = fc.array(
    fc.record({
      id: fc.uuid(),
      category_1: fc.constantFrom('Worship', 'Finance', 'Family', 'Ethics'),
      category_2: fc.constantFrom('Prayer', 'Fasting', 'Zakat', 'Banking', 'Marriage', 'Divorce'),
      category_3: fc.constantFrom('Missed', 'Congregation', 'Taraweeh', 'Interest', 'Mahr', 'Iddah'),
    }),
    { minLength: 0, maxLength: 30 }
  )

  it('(a) the current fatwa is never included in results', () => {
    fc.assert(
      fc.property(currentFatwaArb, otherFatwasArb, (currentFatwa, otherFatwas) => {
        // Include the current fatwa in allFatwas to ensure it gets filtered out
        const allFatwas = [currentFatwa, ...otherFatwas]
        const result = getRelatedFatwas(currentFatwa, allFatwas)

        expect(result.every((f) => f.id !== currentFatwa.id)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('(b) result list length is at most 6 (or maxCount)', () => {
    const maxCountArb = fc.integer({ min: 1, max: 20 })

    fc.assert(
      fc.property(currentFatwaArb, otherFatwasArb, maxCountArb, (currentFatwa, otherFatwas, maxCount) => {
        const allFatwas = [currentFatwa, ...otherFatwas]
        const result = getRelatedFatwas(currentFatwa, allFatwas, maxCount)

        expect(result.length).toBeLessThanOrEqual(maxCount)
      }),
      { numRuns: 100 }
    )
  })

  it('(b) result list length is at most 6 with default maxCount', () => {
    fc.assert(
      fc.property(currentFatwaArb, otherFatwasArb, (currentFatwa, otherFatwas) => {
        const allFatwas = [currentFatwa, ...otherFatwas]
        const result = getRelatedFatwas(currentFatwa, allFatwas)

        expect(result.length).toBeLessThanOrEqual(6)
      }),
      { numRuns: 100 }
    )
  })

  it('(c) all items sharing category_3 with current fatwa appear before category_2-only matches', () => {
    fc.assert(
      fc.property(currentFatwaArb, otherFatwasArb, (currentFatwa, otherFatwas) => {
        const allFatwas = [currentFatwa, ...otherFatwas]
        const result = getRelatedFatwas(currentFatwa, allFatwas)

        // Find indices of cat3 matches and cat2-only matches in the result
        const cat3Indices = []
        const cat2OnlyIndices = []

        result.forEach((f, idx) => {
          if (f.category_3 === currentFatwa.category_3) {
            cat3Indices.push(idx)
          } else if (f.category_2 === currentFatwa.category_2) {
            cat2OnlyIndices.push(idx)
          }
        })

        // All cat3 matches must appear before any cat2-only match
        if (cat3Indices.length > 0 && cat2OnlyIndices.length > 0) {
          expect(Math.max(...cat3Indices)).toBeLessThan(Math.min(...cat2OnlyIndices))
        }
      }),
      { numRuns: 100 }
    )
  })

  it('(d) if fewer than 3 items share category_3, items from category_2 are included to supplement', () => {
    fc.assert(
      fc.property(currentFatwaArb, otherFatwasArb, (currentFatwa, otherFatwas) => {
        const allFatwas = [currentFatwa, ...otherFatwas]
        const result = getRelatedFatwas(currentFatwa, allFatwas)

        // Count how many fatwas in the dataset (excluding current) share category_3
        const cat3Available = otherFatwas.filter(
          (f) => f.category_3 === currentFatwa.category_3 && currentFatwa.category_3 != null
        )

        // Count how many fatwas in the dataset (excluding current) share category_2 but not category_3
        const cat2Available = otherFatwas.filter(
          (f) =>
            f.category_2 === currentFatwa.category_2 &&
            currentFatwa.category_2 != null &&
            f.category_3 !== currentFatwa.category_3
        )

        // If fewer than 3 share category_3 AND there are cat2 supplements available
        if (cat3Available.length < 3 && cat2Available.length > 0) {
          // The result should contain at least one cat2-only item (supplementing)
          const hasCat2Supplement = result.some(
            (f) => f.category_2 === currentFatwa.category_2 && f.category_3 !== currentFatwa.category_3
          )
          expect(hasCat2Supplement).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })
})
