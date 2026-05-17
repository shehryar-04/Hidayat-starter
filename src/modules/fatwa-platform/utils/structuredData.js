/**
 * Structured Data (JSON-LD) generators for the Fatwa Knowledge Platform.
 *
 * Each function returns a plain JS object with @context and @type fields
 * suitable for embedding as JSON-LD in a <script type="application/ld+json"> tag.
 */

/**
 * Truncate a description to at most 160 characters for SEO meta descriptions.
 * @param {string} text - The original description text
 * @returns {string} Truncated text (max 160 chars)
 */
export function truncateDescription(text) {
  if (!text) return ''
  return text.slice(0, 160)
}

/**
 * Generate an SEO-friendly document title for a fatwa page.
 * @param {string} title - The fatwa title
 * @param {string|number} fatwaNumber - The fatwa reference number
 * @returns {string} Formatted SEO title
 */
export function generateSEOTitle(title, fatwaNumber) {
  if (fatwaNumber) {
    return `${title} | Fatwa #${fatwaNumber} | Hidayat Darul Ifta`
  }
  return `${title} | Hidayat Darul Ifta`
}

/**
 * Generate FAQPage JSON-LD schema.
 * @param {string} question - The question text
 * @param {string} answer - The answer text
 * @returns {object} FAQPage JSON-LD object
 */
export function generateFAQPageSchema(question, answer) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer
        }
      }
    ]
  }
}

/**
 * Generate Article JSON-LD schema.
 * @param {object} params
 * @param {string} params.title - Article headline
 * @param {string} params.datePublished - ISO 8601 date string
 * @param {string} params.author - Author/institution name
 * @param {string} params.url - Canonical URL of the article
 * @param {string} params.description - Short description/excerpt
 * @returns {object} Article JSON-LD object
 */
export function generateArticleSchema({ title, datePublished, author, url, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    datePublished,
    author: {
      '@type': 'Organization',
      name: author
    },
    url,
    description
  }
}

/**
 * Generate BreadcrumbList JSON-LD schema.
 * @param {Array<{name: string, url: string}>} breadcrumbs - Ordered array of breadcrumb items
 * @returns {object} BreadcrumbList JSON-LD object
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

/**
 * Generate WebSite JSON-LD schema with search action.
 * @param {object} params
 * @param {string} params.name - Site name
 * @param {string} params.url - Site URL
 * @param {string} params.searchUrl - Search URL template with {search_term_string} placeholder
 * @returns {object} WebSite JSON-LD object
 */
export function generateWebSiteSchema({ name, url, searchUrl }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: searchUrl,
      'query-input': 'required name=search_term_string'
    }
  }
}
