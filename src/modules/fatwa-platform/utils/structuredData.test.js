import { describe, it, expect } from 'vitest'
import {
  generateFAQPageSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateWebSiteSchema
} from './structuredData.js'

describe('structuredData', () => {
  describe('generateFAQPageSchema', () => {
    it('returns valid FAQPage JSON-LD with question and answer', () => {
      const result = generateFAQPageSchema('Is fasting obligatory?', 'Yes, fasting in Ramadan is obligatory.')

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('FAQPage')
      expect(result.mainEntity).toHaveLength(1)
      expect(result.mainEntity[0]['@type']).toBe('Question')
      expect(result.mainEntity[0].name).toBe('Is fasting obligatory?')
      expect(result.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
      expect(result.mainEntity[0].acceptedAnswer.text).toBe('Yes, fasting in Ramadan is obligatory.')
    })
  })

  describe('generateArticleSchema', () => {
    it('returns valid Article JSON-LD with all fields', () => {
      const result = generateArticleSchema({
        title: 'Ruling on Missed Prayers',
        datePublished: '2024-01-15T10:00:00Z',
        author: 'Hidayat Darul Ifta',
        url: 'https://hidayat.org/fatwas/ruling-on-missed-prayers',
        description: 'A detailed ruling on making up missed prayers.'
      })

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('Article')
      expect(result.headline).toBe('Ruling on Missed Prayers')
      expect(result.datePublished).toBe('2024-01-15T10:00:00Z')
      expect(result.author['@type']).toBe('Organization')
      expect(result.author.name).toBe('Hidayat Darul Ifta')
      expect(result.url).toBe('https://hidayat.org/fatwas/ruling-on-missed-prayers')
      expect(result.description).toBe('A detailed ruling on making up missed prayers.')
    })
  })

  describe('generateBreadcrumbSchema', () => {
    it('returns valid BreadcrumbList JSON-LD with correct positions', () => {
      const breadcrumbs = [
        { name: 'Home', url: 'https://hidayat.org/fatwas' },
        { name: 'Worship', url: 'https://hidayat.org/fatwas/category/worship' },
        { name: 'Prayer', url: 'https://hidayat.org/fatwas/category/worship/prayer' }
      ]

      const result = generateBreadcrumbSchema(breadcrumbs)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('BreadcrumbList')
      expect(result.itemListElement).toHaveLength(3)
      expect(result.itemListElement[0].position).toBe(1)
      expect(result.itemListElement[0].name).toBe('Home')
      expect(result.itemListElement[0].item).toBe('https://hidayat.org/fatwas')
      expect(result.itemListElement[1].position).toBe(2)
      expect(result.itemListElement[1].name).toBe('Worship')
      expect(result.itemListElement[2].position).toBe(3)
      expect(result.itemListElement[2].name).toBe('Prayer')
    })

    it('handles single breadcrumb item', () => {
      const result = generateBreadcrumbSchema([{ name: 'Home', url: 'https://hidayat.org/fatwas' }])

      expect(result.itemListElement).toHaveLength(1)
      expect(result.itemListElement[0].position).toBe(1)
    })

    it('handles empty breadcrumbs array', () => {
      const result = generateBreadcrumbSchema([])

      expect(result['@type']).toBe('BreadcrumbList')
      expect(result.itemListElement).toHaveLength(0)
    })
  })

  describe('generateWebSiteSchema', () => {
    it('returns valid WebSite JSON-LD with search action', () => {
      const result = generateWebSiteSchema({
        name: 'Hidayat Fatwa Platform',
        url: 'https://hidayat.org/fatwas',
        searchUrl: 'https://hidayat.org/fatwas/search?q={search_term_string}'
      })

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('WebSite')
      expect(result.name).toBe('Hidayat Fatwa Platform')
      expect(result.url).toBe('https://hidayat.org/fatwas')
      expect(result.potentialAction['@type']).toBe('SearchAction')
      expect(result.potentialAction.target).toBe('https://hidayat.org/fatwas/search?q={search_term_string}')
      expect(result.potentialAction['query-input']).toBe('required name=search_term_string')
    })
  })
})
