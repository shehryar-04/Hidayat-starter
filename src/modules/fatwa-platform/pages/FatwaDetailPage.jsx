import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import BreadcrumbNav from '../components/BreadcrumbNav'
import ReadingProgress from '../components/ReadingProgress'
import ShareButtons from '../components/ShareButtons'
import { RelatedFatwas } from '../components/RelatedFatwas'
import { FatwaCard } from '../components/FatwaCard'
import { useFatwaStore } from '../stores/fatwaStore'
import { useCategories, getCategoryPath } from '../hooks/useCategories'
import { calculateReadingTime } from '../utils/readingTime'
import { detectDirection } from '../utils/rtlDetection'
import { getRelatedFatwas } from '../utils/relatedFatwas'
import {
  generateFAQPageSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateSEOTitle,
  truncateDescription,
} from '../utils/structuredData'

const BASE_URL = 'https://hidayat.org'

/**
 * Count words in a text string.
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0
  return text.trim().split(/\s+/).filter((t) => t.length > 0).length
}

/**
 * Extract headings from answer text for table of contents.
 * Looks for markdown-style headings (## Heading) or lines that appear to be headings.
 * @param {string} text
 * @returns {Array<{ id: string, text: string, level: number }>}
 */
function extractHeadings(text) {
  if (!text) return []
  const headings = []
  const lines = text.split('\n')
  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const headingText = match[2].trim()
      const id = headingText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
      headings.push({ id, text: headingText, level })
    }
  }
  return headings
}

/**
 * FatwaDetailPage — Full fatwa reading experience.
 *
 * Features:
 * - Reading progress bar (fixed top)
 * - Breadcrumb navigation
 * - Header: title, fatwa number, dar_ul_ifta badge
 * - Question section (visually distinct card)
 * - Answer section with "Read More" if >500 words
 * - Estimated reading time display
 * - Sticky sidebar with TOC on desktop (≥1024px), hidden on mobile
 * - Share buttons
 * - Related Fatwas section
 * - "More from this category" section
 * - SEOHead with fatwa-specific meta, OG, Twitter, JSON-LD
 * - RTL detection for Arabic/Urdu content
 * - Increment view count on page load
 * - 404 page for non-existent or unpublished slugs
 * - Semantic HTML with proper heading hierarchy
 */
export default function FatwaDetailPage() {
  const { slug } = useParams()
  const contentRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [fatwa, setFatwa] = useState(null)

  const fetchFatwas = useFatwaStore((state) => state.fetchFatwas)
  const fatwas = useFatwaStore((state) => state.fatwas)
  const getFatwasByCategory = useFatwaStore((state) => state.getFatwasByCategory)
  const incrementView = useFatwaStore((state) => state.incrementView)
  const loading = useFatwaStore((state) => state.loading)

  const { tree } = useCategories()
  const fetchAttempted = useRef(false)

  // Fetch home data (for categories tree)
  useEffect(() => {
    fetchFatwas()
  }, [fetchFatwas])

  // Try to find fatwa from local state or fetch on-demand (runs once per slug)
  useEffect(() => {
    if (!slug) return

    // Reset state for new slug
    fetchAttempted.current = false
    setFatwa(null)
    setNotFound(false)

    // Check local state first
    const state = useFatwaStore.getState()
    const found = state.getFatwaBySlug(slug)
    if (found) {
      setFatwa(found)
      return
    }

    // Fetch from DB once
    fetchAttempted.current = true
    state.fetchFatwaBySlug(slug).then(result => {
      if (result) {
        setFatwa(result)
      } else {
        setNotFound(true)
      }
    })
  }, [slug])

  // Increment view count once when fatwa is found
  useEffect(() => {
    if (fatwa && fatwa.id) {
      incrementView(fatwa.id)
    }
    // Only run once when fatwa is first resolved
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fatwa?.id])

  // Computed values
  const answerWordCount = useMemo(
    () => countWords(fatwa?.response_text),
    [fatwa?.response_text]
  )
  const showReadMore = answerWordCount > 500
  const readingTime = useMemo(
    () =>
      calculateReadingTime(
        `${fatwa?.question_text || ''} ${fatwa?.response_text || ''}`
      ),
    [fatwa?.question_text, fatwa?.response_text]
  )

  const questionDir = useMemo(
    () => detectDirection(fatwa?.question_text),
    [fatwa?.question_text]
  )
  const answerDir = useMemo(
    () => detectDirection(fatwa?.response_text),
    [fatwa?.response_text]
  )

  const relatedFatwas = useMemo(
    () => (fatwa ? getRelatedFatwas(fatwa, fatwas, 6) : []),
    [fatwa, fatwas]
  )

  const moreFatwas = useMemo(() => {
    if (!fatwa || !fatwa.category_1) return []
    return getFatwasByCategory(fatwa.category_1)
      .filter((f) => f.id !== fatwa.id)
      .slice(0, 6)
  }, [fatwa, getFatwasByCategory])

  const headings = useMemo(
    () => extractHeadings(fatwa?.response_text),
    [fatwa?.response_text]
  )

  // Breadcrumb items
  const breadcrumbItems = useMemo(() => {
    if (!fatwa) return []
    const items = [{ name: 'Home', url: '/fatwas' }]
    const categoryPath = getCategoryPath(
      tree,
      fatwa.category_1,
      fatwa.category_2,
      fatwa.category_3
    )
    for (const cat of categoryPath) {
      items.push({ name: cat.name, url: cat.path })
    }
    items.push({ name: fatwa.title, url: `/fatwas/${fatwa.slug}` })
    return items
  }, [fatwa, tree])

  // SEO structured data
  const structuredData = useMemo(() => {
    if (!fatwa) return []
    const schemas = []

    schemas.push(
      generateFAQPageSchema(fatwa.question_text || '', fatwa.response_text || '')
    )

    schemas.push(
      generateArticleSchema({
        title: fatwa.title,
        datePublished: fatwa.published_at || fatwa.created_at,
        author: fatwa.dar_ul_ifta || 'Hidayat Darul Ifta',
        url: `${BASE_URL}/fatwas/${fatwa.slug}`,
        description: truncateDescription(fatwa.question_text || ''),
      })
    )

    schemas.push(
      generateBreadcrumbSchema(
        breadcrumbItems.map((item) => ({
          name: item.name,
          url: `${BASE_URL}${item.url}`,
        }))
      )
    )

    return schemas
  }, [fatwa, breadcrumbItems])

  // Truncated answer text for "Read More"
  const displayedAnswer = useMemo(() => {
    if (!fatwa?.response_text) return ''
    if (!showReadMore || expanded) return fatwa.response_text
    // Truncate to approximately 500 words
    const words = fatwa.response_text.trim().split(/\s+/)
    return words.slice(0, 500).join(' ') + '…'
  }, [fatwa?.response_text, showReadMore, expanded])

  // 404 page
  if (notFound) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <SEOHead
          title="Fatwa Not Found | Hidayat Darul Ifta"
          description="The fatwa you are looking for does not exist or has not been published."
          canonicalUrl={`${BASE_URL}/fatwas/${slug}`}
        />
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Fatwa Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The fatwa you are looking for does not exist or has not been published yet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/fatwas"
              className="inline-block px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              Browse All Fatwas
            </Link>
            <Link
              to="/fatwas/search"
              className="inline-block px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              Search Fatwas
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Loading state
  if (loading || !fatwa) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading fatwa…</p>
        </div>
      </main>
    )
  }

  const canonicalUrl = `${BASE_URL}/fatwas/${fatwa.slug}`
  const seoTitle = generateSEOTitle(fatwa.title)
  const seoDescription = truncateDescription(fatwa.question_text || '')

  return (
    <>
      <ReadingProgress contentRef={contentRef} />

      <main className="min-h-screen bg-gray-50">
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          canonicalUrl={canonicalUrl}
          ogType="article"
          structuredData={structuredData}
        />

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="lg:flex lg:gap-8">
            {/* Main Content */}
            <article
              ref={contentRef}
              className="flex-1 max-w-4xl"
              aria-labelledby="fatwa-title"
            >
              {/* Header */}
              <header className="mb-6">
                <h1
                  id="fatwa-title"
                  className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-3"
                >
                  {fatwa.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {fatwa.category_1 && (
                    <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                      {fatwa.category_1}
                    </span>
                  )}
                  {fatwa.dar_ul_ifta && (
                    <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                      {fatwa.dar_ul_ifta}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-gray-600">
                    <Clock size={14} aria-hidden="true" />
                    {readingTime} min read
                  </span>
                </div>
              </header>

              {/* Question Section */}
              <section aria-labelledby="question-heading" className="mb-8">
                <h2
                  id="question-heading"
                  className="text-lg font-semibold text-gray-800 mb-3"
                >
                  Question
                </h2>
                <div
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-5"
                  dir={questionDir}
                  lang={questionDir === 'rtl' ? 'ar' : undefined}
                >
                  <p
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '1.7' }}
                  >
                    {fatwa.question_text}
                  </p>
                </div>
              </section>

              {/* Answer Section */}
              <section aria-labelledby="answer-heading" className="mb-8">
                <h2
                  id="answer-heading"
                  className="text-lg font-semibold text-gray-800 mb-3"
                >
                  Answer
                </h2>
                <div
                  className="prose prose-gray max-w-none"
                  dir={answerDir}
                  lang={answerDir === 'rtl' ? 'ar' : undefined}
                >
                  <p
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '1.7', maxWidth: '720px' }}
                  >
                    {displayedAnswer}
                  </p>
                </div>
                {showReadMore && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-4 flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-sm transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:rounded-sm"
                    aria-expanded={expanded}
                    aria-controls="answer-heading"
                  >
                    {expanded ? (
                      <>
                        Show Less <ChevronUp size={16} aria-hidden="true" />
                      </>
                    ) : (
                      <>
                        Read More <ChevronDown size={16} aria-hidden="true" />
                      </>
                    )}
                  </button>
                )}
              </section>

              {/* Share Buttons */}
              <section className="mb-8" aria-label="Share this fatwa">
                <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Share
                </h2>
                <ShareButtons url={canonicalUrl} title={fatwa.title} />
              </section>

              {/* Related Fatwas */}
              {relatedFatwas.length > 0 && (
                <motion.section
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                >
                  <RelatedFatwas fatwas={relatedFatwas} />
                </motion.section>
              )}

              {/* More from this Category */}
              {moreFatwas.length > 0 && (
                <motion.section
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 }}
                  aria-labelledby="more-category-heading"
                >
                  <h2
                    id="more-category-heading"
                    className="text-xl font-bold text-gray-800 mb-4"
                  >
                    More from {fatwa.category_1}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {moreFatwas.map((f) => (
                      <FatwaCard key={f.id} fatwa={f} />
                    ))}
                  </div>
                </motion.section>
              )}
            </article>

            {/* Sticky Sidebar — Desktop only (≥1024px) */}
            <aside
              className="hidden lg:block w-64 shrink-0"
              aria-label="Table of contents and navigation"
            >
              <div className="sticky top-16 space-y-6">
                {/* Table of Contents */}
                {headings.length > 0 && (
                  <nav aria-label="Table of contents">
                    <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                      Contents
                    </h2>
                    <ul className="space-y-1.5">
                      {headings.map((heading) => (
                        <li
                          key={heading.id}
                          style={{
                            paddingLeft: `${(heading.level - 2) * 12}px`,
                          }}
                        >
                          <a
                            href={`#${heading.id}`}
                            className="text-sm text-gray-600 hover:text-green-600 transition-colors block py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:rounded-sm"
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}

                {/* Sidebar Share */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                    Share
                  </h2>
                  <ShareButtons url={canonicalUrl} title={fatwa.title} />
                </div>

                {/* Category Links */}
                {fatwa.category_1 && (
                  <nav aria-label="Category navigation">
                    <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                      Category
                    </h2>
                    <ul className="space-y-1.5 text-sm">
                      {breadcrumbItems
                        .filter(
                          (item) =>
                            item.url !== '/fatwas' &&
                            item.url !== `/fatwas/${fatwa.slug}`
                        )
                        .map((item) => (
                          <li key={item.url}>
                            <Link
                              to={item.url}
                              className="text-gray-600 hover:text-green-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:rounded-sm"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </nav>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
