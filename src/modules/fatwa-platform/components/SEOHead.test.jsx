import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import SEOHead from './SEOHead'

function renderSEOHead(props) {
  render(
    <HelmetProvider>
      <SEOHead {...props} />
    </HelmetProvider>
  )
}

describe('SEOHead', () => {
  it('renders the page title', async () => {
    renderSEOHead({
      title: 'Test Fatwa | Fatwa #123 | Hidayat Darul Ifta',
      description: 'A short description',
      canonicalUrl: 'https://hidayat.org/fatwas/test-fatwa'
    })

    await waitFor(() => {
      expect(document.title).toBe('Test Fatwa | Fatwa #123 | Hidayat Darul Ifta')
    })
  })

  it('renders meta description truncated to 160 chars', async () => {
    const longDescription = 'A'.repeat(200)
    renderSEOHead({
      title: 'Title',
      description: longDescription,
      canonicalUrl: 'https://hidayat.org/fatwas/test'
    })

    await waitFor(() => {
      const descMeta = document.querySelector('meta[name="description"]')
      expect(descMeta).not.toBeNull()
      expect(descMeta.getAttribute('content')).toHaveLength(160)
    })
  })

  it('renders canonical URL', async () => {
    renderSEOHead({
      title: 'Title',
      description: 'Desc',
      canonicalUrl: 'https://hidayat.org/fatwas/my-fatwa'
    })

    await waitFor(() => {
      const canonical = document.querySelector('link[rel="canonical"]')
      expect(canonical).not.toBeNull()
      expect(canonical.getAttribute('href')).toBe('https://hidayat.org/fatwas/my-fatwa')
    })
  })

  it('renders OpenGraph tags with default ogType "website"', async () => {
    renderSEOHead({
      title: 'OG Title',
      description: 'OG Description',
      canonicalUrl: 'https://hidayat.org/fatwas/og-test'
    })

    await waitFor(() => {
      const ogTitle = document.querySelector('meta[property="og:title"]')
      expect(ogTitle).not.toBeNull()
      expect(ogTitle.getAttribute('content')).toBe('OG Title')

      const ogDesc = document.querySelector('meta[property="og:description"]')
      expect(ogDesc.getAttribute('content')).toBe('OG Description')

      const ogType = document.querySelector('meta[property="og:type"]')
      expect(ogType.getAttribute('content')).toBe('website')

      const ogUrl = document.querySelector('meta[property="og:url"]')
      expect(ogUrl.getAttribute('content')).toBe('https://hidayat.org/fatwas/og-test')

      const ogSiteName = document.querySelector('meta[property="og:site_name"]')
      expect(ogSiteName.getAttribute('content')).toBe('Hidayat Darul Ifta')
    })
  })

  it('renders ogType as "article" when specified', async () => {
    renderSEOHead({
      title: 'Article',
      description: 'Desc',
      canonicalUrl: 'https://hidayat.org/fatwas/article',
      ogType: 'article'
    })

    await waitFor(() => {
      const ogType = document.querySelector('meta[property="og:type"]')
      expect(ogType).not.toBeNull()
      expect(ogType.getAttribute('content')).toBe('article')
    })
  })

  it('renders Twitter Card tags', async () => {
    renderSEOHead({
      title: 'Twitter Title',
      description: 'Twitter Desc',
      canonicalUrl: 'https://hidayat.org/fatwas/twitter-test'
    })

    await waitFor(() => {
      const twitterCard = document.querySelector('meta[name="twitter:card"]')
      expect(twitterCard).not.toBeNull()
      expect(twitterCard.getAttribute('content')).toBe('summary')

      const twitterTitle = document.querySelector('meta[name="twitter:title"]')
      expect(twitterTitle.getAttribute('content')).toBe('Twitter Title')

      const twitterDesc = document.querySelector('meta[name="twitter:description"]')
      expect(twitterDesc.getAttribute('content')).toBe('Twitter Desc')
    })
  })

  it('renders JSON-LD structured data scripts', async () => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'Test?' }]
    }
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test Article'
    }

    renderSEOHead({
      title: 'Structured Data Test',
      description: 'Desc',
      canonicalUrl: 'https://hidayat.org/fatwas/sd-test',
      structuredData: [faqSchema, articleSchema]
    })

    await waitFor(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      expect(scripts.length).toBe(2)
      expect(JSON.parse(scripts[0].textContent)).toEqual(faqSchema)
      expect(JSON.parse(scripts[1].textContent)).toEqual(articleSchema)
    })
  })

  it('handles empty description gracefully', async () => {
    renderSEOHead({
      title: 'No Desc',
      description: '',
      canonicalUrl: 'https://hidayat.org/fatwas/no-desc'
    })

    await waitFor(() => {
      const descMeta = document.querySelector('meta[name="description"]')
      expect(descMeta).not.toBeNull()
      expect(descMeta.getAttribute('content')).toBe('')
    })
  })

  it('handles undefined structuredData gracefully', async () => {
    renderSEOHead({
      title: 'No SD',
      description: 'Desc',
      canonicalUrl: 'https://hidayat.org/fatwas/no-sd'
    })

    await waitFor(() => {
      expect(document.title).toBe('No SD')
    })
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBe(0)
  })
})
