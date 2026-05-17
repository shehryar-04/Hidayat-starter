import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateSitemap } from './sitemapGenerator.js'

/**
 * Feature: fatwa-knowledge-platform, Property 16: Sitemap Completeness
 * Validates: Requirements 3.5
 */
describe('Property 16: Sitemap Completeness', () => {
  const baseUrl = 'https://hidayat.org'

  // Arbitrary for generating a non-empty slug (lowercase alphanumeric + hyphens)
  const slugArb = fc
    .stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/, { size: 'small' })
    .filter((s) => s.length > 0 && s.length <= 80)

  // Arbitrary for category values (non-empty strings that slugify to something)
  const categoryArb = fc.oneof(
    fc.constant(undefined),
    fc.string({ minLength: 1, maxLength: 20 })
  )

  // Arbitrary for a fatwa object
  const fatwaArb = fc.record({
    slug: fc.oneof(slugArb, fc.constant('')),
    published_at: fc.oneof(fc.constant(undefined), fc.constant('2024-01-15T00:00:00Z')),
    category_1: categoryArb,
    category_2: categoryArb,
    category_3: categoryArb
  })

  /**
   * Helper: slugify matching the implementation in sitemapGenerator.js
   */
  function slugify(text) {
    if (!text || typeof text !== 'string') return ''
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Helper: compute expected unique category page paths independently
   */
  function computeExpectedCategoryPaths(fatwas) {
    const paths = new Set()
    for (const fatwa of fatwas) {
      const cat1 = fatwa.category_1
      const cat2 = fatwa.category_2
      const cat3 = fatwa.category_3

      if (cat1) {
        const cat1Slug = slugify(cat1)
        if (cat1Slug) {
          paths.add(`/fatwas/category/${cat1Slug}`)

          if (cat2) {
            const cat2Slug = slugify(cat2)
            if (cat2Slug) {
              paths.add(`/fatwas/category/${cat1Slug}/${cat2Slug}`)

              if (cat3) {
                const cat3Slug = slugify(cat3)
                if (cat3Slug) {
                  paths.add(`/fatwas/category/${cat1Slug}/${cat2Slug}/${cat3Slug}`)
                }
              }
            }
          }
        }
      }
    }
    return paths
  }

  /**
   * Helper: count <url> entries in XML sitemap string
   */
  function countUrlEntries(xml) {
    const matches = xml.match(/<url>/g)
    return matches ? matches.length : 0
  }

  /**
   * Helper: extract all <loc> values from XML sitemap
   */
  function extractLocs(xml) {
    const locRegex = /<loc>(.*?)<\/loc>/g
    const locs = []
    let match
    while ((match = locRegex.exec(xml)) !== null) {
      locs.push(match[1])
    }
    return locs
  }

  it('total URLs = fatwa URLs + category URLs for any set of fatwas', () => {
    fc.assert(
      fc.property(
        fc.array(fatwaArb, { minLength: 0, maxLength: 30 }),
        (fatwas) => {
          const xml = generateSitemap(fatwas, baseUrl)

          // Count fatwas with non-empty slugs
          const fatwaUrlCount = fatwas.filter((f) => f.slug && f.slug.length > 0).length

          // Compute expected category paths independently
          const expectedCategoryPaths = computeExpectedCategoryPaths(fatwas)
          const categoryUrlCount = expectedCategoryPaths.size

          // Count total <url> entries in the XML
          const totalUrls = countUrlEntries(xml)

          // Assert: total URLs = fatwa URLs + category URLs
          expect(totalUrls).toBe(fatwaUrlCount + categoryUrlCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('number of fatwa URLs equals number of fatwas with non-empty slugs', () => {
    fc.assert(
      fc.property(
        fc.array(fatwaArb, { minLength: 0, maxLength: 30 }),
        (fatwas) => {
          const xml = generateSitemap(fatwas, baseUrl)
          const locs = extractLocs(xml)

          // Count fatwas with non-empty slugs
          const expectedFatwaCount = fatwas.filter((f) => f.slug && f.slug.length > 0).length

          // Count locs that match the fatwa URL pattern
          const fatwaLocs = locs.filter(
            (loc) => loc.startsWith(`${baseUrl}/fatwas/`) && !loc.includes('/fatwas/category/')
          )

          expect(fatwaLocs.length).toBe(expectedFatwaCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('number of category URLs equals number of unique category page paths', () => {
    fc.assert(
      fc.property(
        fc.array(fatwaArb, { minLength: 0, maxLength: 30 }),
        (fatwas) => {
          const xml = generateSitemap(fatwas, baseUrl)
          const locs = extractLocs(xml)

          // Compute expected category paths independently
          const expectedCategoryPaths = computeExpectedCategoryPaths(fatwas)

          // Count locs that match the category URL pattern
          const categoryLocs = locs.filter((loc) => loc.includes('/fatwas/category/'))

          expect(categoryLocs.length).toBe(expectedCategoryPaths.size)
        }
      ),
      { numRuns: 100 }
    )
  })
})
