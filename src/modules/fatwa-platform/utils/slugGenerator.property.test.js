import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateSlug } from './slugGenerator.js'

/**
 * Feature: fatwa-knowledge-platform
 * Property 1: Slug Format Invariant
 *
 * For any input string (including Unicode, special characters, and mixed scripts),
 * the Slug Generator SHALL produce an output containing only lowercase alphanumeric
 * characters and hyphens, matching the pattern /^[a-z0-9]+(-[a-z0-9]+)*$/.
 *
 * Validates: Requirements 3.1, 3.2
 */
describe('Feature: fatwa-knowledge-platform, Property 1: Slug Format Invariant', () => {
  const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

  it('output matches /^[a-z0-9]+(-[a-z0-9]+)*$/ for any string title and string fatwaNumber', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (title, fatwaNumber) => {
          const slug = generateSlug(title, fatwaNumber, new Set())
          expect(slug).toMatch(SLUG_PATTERN)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('output matches /^[a-z0-9]+(-[a-z0-9]+)*$/ for any unicode title', () => {
    // Generate strings with mixed unicode content (Arabic, special chars, emoji-like)
    const unicodeTitle = fc.stringMatching(/^[\u0600-\u06FF\u0750-\u077F\u0041-\u005A\u0030-\u0039\s!@#$%^&*()]*$/, { minLength: 0, maxLength: 100 })
    fc.assert(
      fc.property(
        unicodeTitle,
        fc.nat().map(n => String(n)),
        (title, fatwaNumber) => {
          const slug = generateSlug(title, fatwaNumber, new Set())
          expect(slug).toMatch(SLUG_PATTERN)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('output matches /^[a-z0-9]+(-[a-z0-9]+)*$/ for any title with numeric fatwaNumber', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.nat({ max: 99999 }),
        (title, fatwaNumber) => {
          const slug = generateSlug(title, fatwaNumber, new Set())
          expect(slug).toMatch(SLUG_PATTERN)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: fatwa-knowledge-platform
 * Property 2: Slug Uniqueness
 *
 * For any two fatwas with titles that produce identical base slugs but different
 * fatwa_numbers, the Slug Generator SHALL produce distinct final slugs.
 *
 * Validates: Requirements 3.1, 3.2
 */
describe('Feature: fatwa-knowledge-platform, Property 2: Slug Uniqueness', () => {
  it('duplicate base slugs with different fatwa_numbers produce distinct slugs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/, { minLength: 1, maxLength: 20 }),
        fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/, { minLength: 1, maxLength: 20 }),
        (title, fatwaNumber1, fatwaNumber2) => {
          // Only test when fatwa numbers are different
          fc.pre(fatwaNumber1 !== fatwaNumber2)

          // Generate the base slug (without collision)
          const baseSlug = generateSlug(title, fatwaNumber1, new Set())

          // Now simulate collision: put the base slug in existingSlugs
          const existingSlugs = new Set([baseSlug])

          // Generate slugs for both fatwa numbers with the collision set
          const slug1 = generateSlug(title, fatwaNumber1, existingSlugs)
          const slug2 = generateSlug(title, fatwaNumber2, existingSlugs)

          // Both should be valid slugs
          expect(slug1).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          expect(slug2).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)

          // They must be different from each other
          expect(slug1).not.toBe(slug2)
        }
      ),
      { numRuns: 100 }
    )
  })
})
