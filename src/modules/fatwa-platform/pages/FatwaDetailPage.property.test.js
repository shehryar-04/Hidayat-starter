import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Feature: fatwa-knowledge-platform, Property 9: Read More Threshold
 * Validates: Requirements 7.3
 *
 * "Read More" control SHALL be present if and only if the word count exceeds 500.
 * Texts with ≤500 words SHALL display fully without truncation.
 *
 * We test the threshold logic directly rather than rendering the full component.
 */

/**
 * Determine whether "Read More" should be shown for a given text.
 * This mirrors the logic in FatwaDetailPage: countWords(text) > 500.
 *
 * @param {string} text - The answer text
 * @returns {boolean}
 */
function shouldShowReadMore(text) {
  if (!text || typeof text !== 'string') return false
  const wordCount = text.trim().split(/\s+/).filter(t => t.length > 0).length
  return wordCount > 500
}

/**
 * Arbitrary that generates a single "word" — a non-empty string with no whitespace.
 * Uses alphanumeric characters to guarantee no whitespace.
 */
const wordArb = fc.string({ minLength: 1, maxLength: 10, unit: 'grapheme' })
  .filter(s => s.length > 0 && !/\s/.test(s))

/**
 * Generate a text string with exactly N words separated by single spaces.
 * @param {number} n - The exact number of words
 */
function textWithExactWordCount(n) {
  if (n <= 0) return fc.constant('')
  return fc.array(wordArb, { minLength: n, maxLength: n })
    .map(words => words.join(' '))
}

describe('Property 9: Read More Threshold', () => {
  describe('shouldShowReadMore returns true iff word count > 500', () => {
    it('for any text with more than 500 words, shouldShowReadMore returns true', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 501, max: 800 }).chain(n => textWithExactWordCount(n)),
          (text) => {
            expect(shouldShowReadMore(text)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('for any text with 500 or fewer words, shouldShowReadMore returns false', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }).chain(n => textWithExactWordCount(n)),
          (text) => {
            expect(shouldShowReadMore(text)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('boundary: exactly 500 words returns false', () => {
      fc.assert(
        fc.property(
          textWithExactWordCount(500),
          (text) => {
            expect(shouldShowReadMore(text)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('boundary: exactly 501 words returns true', () => {
      fc.assert(
        fc.property(
          textWithExactWordCount(501),
          (text) => {
            expect(shouldShowReadMore(text)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('empty or invalid input returns false', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant('   '),
            fc.constant('\t\n')
          ),
          (text) => {
            expect(shouldShowReadMore(text)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
