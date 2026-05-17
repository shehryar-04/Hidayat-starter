import { describe, it, expect } from 'vitest'
import { generateSitemap, generateRobotsTxt } from './sitemapGenerator.js'

describe('sitemapGenerator', () => {
  describe('generateSitemap', () => {
    it('generates valid XML with urlset root element', () => {
      const xml = generateSitemap([], 'https://example.com')
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
      expect(xml).toContain('</urlset>')
    })

    it('includes one <url> entry per published fatwa', () => {
      const fatwas = [
        { slug: 'ruling-on-prayer', category_1: 'Worship' },
        { slug: 'fasting-rules', category_1: 'Worship' },
        { slug: 'zakat-calculation', category_1: 'Finance' }
      ]
      const xml = generateSitemap(fatwas, 'https://example.com')

      expect(xml).toContain('<loc>https://example.com/fatwas/ruling-on-prayer</loc>')
      expect(xml).toContain('<loc>https://example.com/fatwas/fasting-rules</loc>')
      expect(xml).toContain('<loc>https://example.com/fatwas/zakat-calculation</loc>')
    })

    it('includes lastmod when published_at is provided', () => {
      const fatwas = [
        { slug: 'test-fatwa', published_at: '2024-03-15T10:00:00Z', category_1: 'Test' }
      ]
      const xml = generateSitemap(fatwas, 'https://example.com')
      expect(xml).toContain('<lastmod>2024-03-15</lastmod>')
    })

    it('omits lastmod when published_at is not provided', () => {
      const fatwas = [{ slug: 'test-fatwa', category_1: 'Test' }]
      const xml = generateSitemap(fatwas, 'https://example.com')
      expect(xml).not.toContain('<lastmod>')
    })

    it('includes unique category page URLs', () => {
      const fatwas = [
        { slug: 'fatwa-1', category_1: 'Worship', category_2: 'Prayer', category_3: 'Missed Prayers' },
        { slug: 'fatwa-2', category_1: 'Worship', category_2: 'Prayer', category_3: 'Congregation' },
        { slug: 'fatwa-3', category_1: 'Finance', category_2: 'Zakat' }
      ]
      const xml = generateSitemap(fatwas, 'https://example.com')

      // Category level 1
      expect(xml).toContain('<loc>https://example.com/fatwas/category/worship</loc>')
      expect(xml).toContain('<loc>https://example.com/fatwas/category/finance</loc>')
      // Category level 2
      expect(xml).toContain('<loc>https://example.com/fatwas/category/worship/prayer</loc>')
      expect(xml).toContain('<loc>https://example.com/fatwas/category/finance/zakat</loc>')
      // Category level 3
      expect(xml).toContain('<loc>https://example.com/fatwas/category/worship/prayer/missed-prayers</loc>')
      expect(xml).toContain('<loc>https://example.com/fatwas/category/worship/prayer/congregation</loc>')
    })

    it('does not duplicate category URLs for fatwas in the same category', () => {
      const fatwas = [
        { slug: 'fatwa-1', category_1: 'Worship', category_2: 'Prayer' },
        { slug: 'fatwa-2', category_1: 'Worship', category_2: 'Prayer' }
      ]
      const xml = generateSitemap(fatwas, 'https://example.com')

      const worshipMatches = xml.match(/fatwas\/category\/worship<\/loc>/g)
      expect(worshipMatches).toHaveLength(1)

      const prayerMatches = xml.match(/fatwas\/category\/worship\/prayer<\/loc>/g)
      expect(prayerMatches).toHaveLength(1)
    })

    it('skips fatwas without a slug', () => {
      const fatwas = [
        { slug: 'valid-fatwa', category_1: 'Test' },
        { slug: '', category_1: 'Test' },
        { slug: null, category_1: 'Test' }
      ]
      const xml = generateSitemap(fatwas, 'https://example.com')
      expect(xml).toContain('<loc>https://example.com/fatwas/valid-fatwa</loc>')
      // Only one fatwa URL entry
      const fatwaUrlMatches = xml.match(/fatwas\/[^c][^a]/g)
      // valid-fatwa is the only fatwa URL
      expect(xml).not.toContain('<loc>https://example.com/fatwas/</loc>')
    })

    it('handles trailing slash in baseUrl', () => {
      const fatwas = [{ slug: 'test', category_1: 'Cat' }]
      const xml = generateSitemap(fatwas, 'https://example.com/')
      expect(xml).toContain('<loc>https://example.com/fatwas/test</loc>')
      expect(xml).not.toContain('https://example.com//fatwas')
    })

    it('escapes XML special characters in URLs', () => {
      const fatwas = [{ slug: 'test&fatwa', category_1: 'Cat' }]
      const xml = generateSitemap(fatwas, 'https://example.com')
      expect(xml).toContain('&amp;')
      expect(xml).not.toContain('&fatwa')
    })

    it('returns empty urlset for empty fatwas array', () => {
      const xml = generateSitemap([], 'https://example.com')
      expect(xml).toContain('<urlset')
      expect(xml).toContain('</urlset>')
      expect(xml).not.toContain('<url>')
    })
  })

  describe('generateRobotsTxt', () => {
    it('generates robots.txt with User-agent, Allow, and Sitemap directives', () => {
      const result = generateRobotsTxt('https://example.com/sitemap.xml')
      expect(result).toBe('User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml')
    })

    it('includes the exact sitemap URL provided', () => {
      const url = 'https://hidayat.org/sitemap.xml'
      const result = generateRobotsTxt(url)
      expect(result).toContain(`Sitemap: ${url}`)
    })

    it('allows all user agents', () => {
      const result = generateRobotsTxt('https://example.com/sitemap.xml')
      expect(result).toContain('User-agent: *')
    })

    it('allows all paths', () => {
      const result = generateRobotsTxt('https://example.com/sitemap.xml')
      expect(result).toContain('Allow: /')
    })
  })
})
