import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateReadingTime } from './readingTime.js'

/**
 * Feature: fatwa-knowledge-platform, Property 8: Reading Time Calculation
 * Validates: Requirements 7.4
 */
describe('Property 8: Reading Time Calculation', () => {
  it('returns Math.ceil(wordCount / 200) with min 1 for arbitrary strings', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = calculateReadingTime(text)

        // Count words by splitting on whitespace and filtering empty tokens
        const words = text.trim().split(/\s+/).filter(token => token.length > 0)
        const wordCount = words.length

        const expected = Math.max(1, Math.ceil(wordCount / 200))
        expect(result).toBe(expected)
      }),
      { numRuns: 100 }
    )
  })

  it('returns Math.ceil(wordCount / 200) with min 1 for arrays of words', () => {
    const wordArb = fc.string({ minLength: 1, maxLength: 20 }).filter(w => w.trim().length > 0 && !/\s/.test(w))
    fc.assert(
      fc.property(
        fc.array(wordArb, { minLength: 0, maxLength: 1000 }),
        (words) => {
          const text = words.join(' ')
          const result = calculateReadingTime(text)

          const wordCount = words.length
          const expected = Math.max(1, Math.ceil(wordCount / 200))
          expect(result).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('always returns a value >= 1', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = calculateReadingTime(text)
        expect(result).toBeGreaterThanOrEqual(1)
      }),
      { numRuns: 100 }
    )
  })
})
