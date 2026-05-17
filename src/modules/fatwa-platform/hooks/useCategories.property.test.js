import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { buildCategoryTree } from './useCategories'

/**
 * Feature: fatwa-knowledge-platform, Property 6: Category Tree Correctness
 *
 * For any set of published fatwas with category_1, category_2, and category_3 values,
 * the computed category tree SHALL:
 * (a) contain every unique category_1 as a top-level node
 * (b) contain every unique category_2 as a child of its correct category_1
 * (c) contain every unique category_3 as a child of its correct category_2
 * (d) display a count at each node equal to the number of published fatwas in that category
 *
 * **Validates: Requirements 5.2, 5.3, 5.4**
 */

// Generator for a category string (non-empty, alphanumeric with spaces to avoid edge cases with separators)
const categoryArb = fc.stringMatching(/^[a-zA-Z0-9\u0600-\u06FF ]{1,20}$/)

// Generator for a single fatwa object with arbitrary category values
const fatwaArbitrary = fc.record({
  id: fc.uuid(),
  category_1: fc.oneof(fc.constant(null), categoryArb),
  category_2: fc.oneof(fc.constant(null), categoryArb),
  category_3: fc.oneof(fc.constant(null), categoryArb),
})

// Generator for an array of fatwas
const fatwasArbitrary = fc.array(fatwaArbitrary, { minLength: 0, maxLength: 50 })

describe('Feature: fatwa-knowledge-platform, Property 6: Category Tree Correctness', () => {
  it('(a) every unique non-null category_1 appears as a top-level key', () => {
    fc.assert(
      fc.property(fatwasArbitrary, (fatwas) => {
        const tree = buildCategoryTree(fatwas)

        // Collect all unique non-null category_1 values
        const uniqueCat1 = new Set(
          fatwas.filter((f) => f.category_1 != null).map((f) => f.category_1)
        )

        for (const cat1 of uniqueCat1) {
          expect(tree[cat1]).toBeDefined()
          expect(tree[cat1].name).toBe(cat1)
        }

        // No extra top-level keys beyond unique cat1 values
        expect(Object.keys(tree).length).toBe(uniqueCat1.size)
      }),
      { numRuns: 100 }
    )
  })

  it('(b) every unique category_2 appears as a child of its correct category_1', () => {
    fc.assert(
      fc.property(fatwasArbitrary, (fatwas) => {
        const tree = buildCategoryTree(fatwas)

        // For each fatwa with both cat1 and cat2, verify cat2 is a child of cat1
        for (const f of fatwas) {
          if (f.category_1 != null && f.category_2 != null) {
            expect(tree[f.category_1]).toBeDefined()
            expect(tree[f.category_1].children[f.category_2]).toBeDefined()
            expect(tree[f.category_1].children[f.category_2].name).toBe(f.category_2)
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  it('(c) every unique category_3 appears as a child of its correct category_2', () => {
    fc.assert(
      fc.property(fatwasArbitrary, (fatwas) => {
        const tree = buildCategoryTree(fatwas)

        // For each fatwa with cat1, cat2, and cat3, verify cat3 is a child of cat2
        for (const f of fatwas) {
          if (f.category_1 != null && f.category_2 != null && f.category_3 != null) {
            expect(tree[f.category_1]).toBeDefined()
            expect(tree[f.category_1].children[f.category_2]).toBeDefined()
            expect(tree[f.category_1].children[f.category_2].children[f.category_3]).toBeDefined()
            expect(tree[f.category_1].children[f.category_2].children[f.category_3].name).toBe(f.category_3)
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  it('(d) count at each node equals the number of fatwas with that category value', () => {
    fc.assert(
      fc.property(fatwasArbitrary, (fatwas) => {
        const tree = buildCategoryTree(fatwas)

        // Verify cat1 counts: number of fatwas with that category_1 (non-null)
        const cat1Counts = new Map()
        for (const f of fatwas) {
          if (f.category_1 != null) {
            cat1Counts.set(f.category_1, (cat1Counts.get(f.category_1) || 0) + 1)
          }
        }
        for (const [cat1, expectedCount] of cat1Counts) {
          expect(tree[cat1].count).toBe(expectedCount)
        }

        // Verify cat2 counts: number of fatwas with that (cat1, cat2) pair
        const cat2Counts = new Map()
        for (const f of fatwas) {
          if (f.category_1 != null && f.category_2 != null) {
            const key = JSON.stringify([f.category_1, f.category_2])
            cat2Counts.set(key, (cat2Counts.get(key) || 0) + 1)
          }
        }
        for (const [key, expectedCount] of cat2Counts) {
          const [cat1, cat2] = JSON.parse(key)
          expect(tree[cat1].children[cat2].count).toBe(expectedCount)
        }

        // Verify cat3 counts: number of fatwas with that (cat1, cat2, cat3) triple
        const cat3Counts = new Map()
        for (const f of fatwas) {
          if (f.category_1 != null && f.category_2 != null && f.category_3 != null) {
            const key = JSON.stringify([f.category_1, f.category_2, f.category_3])
            cat3Counts.set(key, (cat3Counts.get(key) || 0) + 1)
          }
        }
        for (const [key, expectedCount] of cat3Counts) {
          const [cat1, cat2, cat3] = JSON.parse(key)
          expect(tree[cat1].children[cat2].children[cat3].count).toBe(expectedCount)
        }
      }),
      { numRuns: 100 }
    )
  })
})
