import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  truncateDescription,
  generateSEOTitle,
  generateFAQPageSchema,
  generateArticleSchema,
  generateBreadcrumbSchema
} from './structuredData.js'

describe('Feature: fatwa-knowledge-platform, Property 3: Meta Description Truncation', () => {
  /**
   * **Validates: Requirements 1.2**
   *
   * For any question text of any length, the SEO_Manager's meta description output
   * SHALL be at most 160 characters long and SHALL be a prefix of the original
   * question text (or the full text if ≤160 characters).
   */
  it('output is always ≤160 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (text) => {
          const result = truncateDescription(text)
          expect(result.length).toBeLessThanOrEqual(160)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('output is a prefix of the original text', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (text) => {
          const result = truncateDescription(text)
          if (text.length <= 160) {
            expect(result).toBe(text)
          } else {
            expect(text.startsWith(result)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: fatwa-knowledge-platform, Property 4: SEO Title Format', () => {
  /**
   * **Validates: Requirements 1.1**
   *
   * For any fatwa with a title and reference number, the SEO_Manager SHALL produce
   * a document title containing the fatwa title, the fatwa number prefixed with "#",
   * and the string "Hidayat Darul Ifta".
   */
  it('SEO title contains the fatwa title, "#" + number, and "Hidayat Darul Ifta"', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.oneof(
          fc.nat().map(String),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0)
        ),
        (title, fatwaNumber) => {
          const result = generateSEOTitle(title, fatwaNumber)
          expect(result).toContain(title)
          expect(result).toContain(`#${fatwaNumber}`)
          expect(result).toContain('Hidayat Darul Ifta')
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: fatwa-knowledge-platform, Property 5: Structured Data Completeness', () => {
  /**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   *
   * For any published fatwa with question text, answer text, title, publication date,
   * and category hierarchy, the SEO_Manager SHALL produce valid JSON-LD containing:
   * (a) an FAQPage schema with the question and answer,
   * (b) an Article schema with headline, datePublished, and author,
   * (c) a BreadcrumbList schema with items matching the category depth.
   */

  const fatwaArbitrary = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }),
    question: fc.string({ minLength: 1, maxLength: 500 }),
    answer: fc.string({ minLength: 1, maxLength: 1000 }),
    datePublished: fc.date({ min: new Date('2000-01-01T00:00:00.000Z'), max: new Date('2030-12-31T23:59:59.999Z') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString()),
    author: fc.string({ minLength: 1, maxLength: 100 }),
    url: fc.webUrl(),
    categories: fc.array(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        url: fc.webUrl()
      }),
      { minLength: 1, maxLength: 5 }
    )
  })

  it('FAQPage schema has @context, @type "FAQPage", and mainEntity with question/answer', () => {
    fc.assert(
      fc.property(fatwaArbitrary, (fatwa) => {
        const faqSchema = generateFAQPageSchema(fatwa.question, fatwa.answer)

        expect(faqSchema['@context']).toBe('https://schema.org')
        expect(faqSchema['@type']).toBe('FAQPage')
        expect(faqSchema.mainEntity).toBeDefined()
        expect(Array.isArray(faqSchema.mainEntity)).toBe(true)
        expect(faqSchema.mainEntity.length).toBeGreaterThan(0)

        const questionItem = faqSchema.mainEntity[0]
        expect(questionItem['@type']).toBe('Question')
        expect(questionItem.name).toBe(fatwa.question)
        expect(questionItem.acceptedAnswer['@type']).toBe('Answer')
        expect(questionItem.acceptedAnswer.text).toBe(fatwa.answer)
      }),
      { numRuns: 100 }
    )
  })

  it('Article schema has @context, @type "Article", headline, datePublished, and author', () => {
    fc.assert(
      fc.property(fatwaArbitrary, (fatwa) => {
        const articleSchema = generateArticleSchema({
          title: fatwa.title,
          datePublished: fatwa.datePublished,
          author: fatwa.author,
          url: fatwa.url,
          description: fatwa.question.slice(0, 160)
        })

        expect(articleSchema['@context']).toBe('https://schema.org')
        expect(articleSchema['@type']).toBe('Article')
        expect(articleSchema.headline).toBe(fatwa.title)
        expect(articleSchema.datePublished).toBe(fatwa.datePublished)
        expect(articleSchema.author).toBeDefined()
        expect(articleSchema.author.name).toBe(fatwa.author)
      }),
      { numRuns: 100 }
    )
  })

  it('BreadcrumbList schema has @context, @type "BreadcrumbList", and correct number of items', () => {
    fc.assert(
      fc.property(fatwaArbitrary, (fatwa) => {
        const breadcrumbSchema = generateBreadcrumbSchema(fatwa.categories)

        expect(breadcrumbSchema['@context']).toBe('https://schema.org')
        expect(breadcrumbSchema['@type']).toBe('BreadcrumbList')
        expect(breadcrumbSchema.itemListElement).toBeDefined()
        expect(Array.isArray(breadcrumbSchema.itemListElement)).toBe(true)
        expect(breadcrumbSchema.itemListElement.length).toBe(fatwa.categories.length)

        breadcrumbSchema.itemListElement.forEach((item, index) => {
          expect(item['@type']).toBe('ListItem')
          expect(item.position).toBe(index + 1)
          expect(item.name).toBe(fatwa.categories[index].name)
          expect(item.item).toBe(fatwa.categories[index].url)
        })
      }),
      { numRuns: 100 }
    )
  })
})
