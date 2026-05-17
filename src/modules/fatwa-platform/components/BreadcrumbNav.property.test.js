import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Feature: fatwa-knowledge-platform, Property 7: Breadcrumb Path Correctness
 * Validates: Requirements 6.1, 6.2
 *
 * These tests validate the breadcrumb data construction logic (not React rendering).
 * Helper functions build the breadcrumb items array given fatwa data or category path.
 */

/**
 * Build breadcrumb items for a fatwa detail page.
 * A fatwa with categories [cat1, cat2, cat3] and title produces:
 * ["Home", cat1, cat2, cat3, title] — 5 segments total.
 *
 * @param {{ category_1: string, category_2: string, category_3: string, title: string }} fatwa
 * @returns {Array<{ name: string, url: string }>}
 */
function buildFatwaBreadcrumb(fatwa) {
  const { category_1, category_2, category_3, title, slug } = fatwa
  return [
    { name: 'Home', url: '/fatwas' },
    { name: category_1, url: `/fatwas/category/${encodeURIComponent(category_1)}` },
    { name: category_2, url: `/fatwas/category/${encodeURIComponent(category_1)}/${encodeURIComponent(category_2)}` },
    { name: category_3, url: `/fatwas/category/${encodeURIComponent(category_1)}/${encodeURIComponent(category_2)}/${encodeURIComponent(category_3)}` },
    { name: title, url: `/fatwas/${slug || ''}` },
  ]
}

/**
 * Build breadcrumb items for a category page at a given depth.
 * Depth 1: ["Home", cat1] — 2 segments
 * Depth 2: ["Home", cat1, cat2] — 3 segments
 * Depth 3: ["Home", cat1, cat2, cat3] — 4 segments
 *
 * @param {string[]} categoryPath - Array of category names from depth 1 to N
 * @returns {Array<{ name: string, url: string }>}
 */
function buildCategoryBreadcrumb(categoryPath) {
  const items = [{ name: 'Home', url: '/fatwas' }]
  let urlPath = '/fatwas/category'

  for (const category of categoryPath) {
    urlPath += `/${encodeURIComponent(category)}`
    items.push({ name: category, url: urlPath })
  }

  return items
}

describe('Property 7: Breadcrumb Path Correctness', () => {
  // Arbitrary for non-empty strings (category names and titles)
  const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0)

  describe('Fatwa breadcrumb has ["Home", cat1, cat2, cat3, title] — 5 segments total', () => {
    it('for any fatwa with categories [cat1, cat2, cat3] and title, breadcrumb items array has exactly 5 segments', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          nonEmptyStringArb,
          nonEmptyStringArb,
          fc.string({ minLength: 1, maxLength: 80 }),
          (cat1, cat2, cat3, title, slug) => {
            const fatwa = { category_1: cat1, category_2: cat2, category_3: cat3, title, slug }
            const breadcrumb = buildFatwaBreadcrumb(fatwa)

            // Must have exactly 5 segments
            expect(breadcrumb).toHaveLength(5)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('for any fatwa, breadcrumb names are ["Home", cat1, cat2, cat3, title] in that exact order', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          nonEmptyStringArb,
          nonEmptyStringArb,
          fc.string({ minLength: 1, maxLength: 80 }),
          (cat1, cat2, cat3, title, slug) => {
            const fatwa = { category_1: cat1, category_2: cat2, category_3: cat3, title, slug }
            const breadcrumb = buildFatwaBreadcrumb(fatwa)

            const names = breadcrumb.map(item => item.name)
            expect(names).toEqual(['Home', cat1, cat2, cat3, title])
          }
        ),
        { numRuns: 100 }
      )
    })

    it('for any fatwa, the first segment is always "Home" pointing to /fatwas', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          nonEmptyStringArb,
          nonEmptyStringArb,
          fc.string({ minLength: 1, maxLength: 80 }),
          (cat1, cat2, cat3, title, slug) => {
            const fatwa = { category_1: cat1, category_2: cat2, category_3: cat3, title, slug }
            const breadcrumb = buildFatwaBreadcrumb(fatwa)

            expect(breadcrumb[0].name).toBe('Home')
            expect(breadcrumb[0].url).toBe('/fatwas')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Category page at depth N has exactly N+1 segments starting with "Home"', () => {
    it('for any category page at depth 1-3, breadcrumb has exactly N+1 segments', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          fc.array(nonEmptyStringArb, { minLength: 3, maxLength: 3 }),
          (depth, categories) => {
            const categoryPath = categories.slice(0, depth)
            const breadcrumb = buildCategoryBreadcrumb(categoryPath)

            // Breadcrumb should have exactly N+1 segments (Home + N categories)
            expect(breadcrumb).toHaveLength(depth + 1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('for any category page, the first segment is always "Home"', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          fc.array(nonEmptyStringArb, { minLength: 3, maxLength: 3 }),
          (depth, categories) => {
            const categoryPath = categories.slice(0, depth)
            const breadcrumb = buildCategoryBreadcrumb(categoryPath)

            expect(breadcrumb[0].name).toBe('Home')
            expect(breadcrumb[0].url).toBe('/fatwas')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('for any category page, segment names match ["Home", ...categoryPath]', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          fc.array(nonEmptyStringArb, { minLength: 3, maxLength: 3 }),
          (depth, categories) => {
            const categoryPath = categories.slice(0, depth)
            const breadcrumb = buildCategoryBreadcrumb(categoryPath)

            const names = breadcrumb.map(item => item.name)
            expect(names).toEqual(['Home', ...categoryPath])
          }
        ),
        { numRuns: 100 }
      )
    })

    it('for any category page, URLs build incrementally from /fatwas/category/', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          fc.array(nonEmptyStringArb, { minLength: 3, maxLength: 3 }),
          (depth, categories) => {
            const categoryPath = categories.slice(0, depth)
            const breadcrumb = buildCategoryBreadcrumb(categoryPath)

            // First item is Home
            expect(breadcrumb[0].url).toBe('/fatwas')

            // Each subsequent item builds on the previous URL
            let expectedUrl = '/fatwas/category'
            for (let i = 0; i < depth; i++) {
              expectedUrl += `/${encodeURIComponent(categoryPath[i])}`
              expect(breadcrumb[i + 1].url).toBe(expectedUrl)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
