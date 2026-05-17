import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Building2, TrendingUp, Clock } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import SearchInput from '../components/SearchInput'
import { FatwaCard } from '../components/FatwaCard'
import PlatformStats from '../components/PlatformStats'
import { useSearch } from '../hooks/useSearch'
import { useFatwaStore } from '../stores/fatwaStore'
import { useCategories } from '../hooks/useCategories'
import { useBasePath } from '../hooks/useBasePath'
import { generateWebSiteSchema } from '../utils/structuredData'
import { isValidCategoryName } from '../utils/categoryFilter'
import { detectDirection } from '../utils/rtlDetection'

/**
 * Framer Motion variants for section entrance animations.
 * Each section fades in and slides up with staggered timing.
 */
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

/**
 * PlatformHomePage — the main landing page for the Fatwa Knowledge Platform.
 *
 * Sections:
 * - Hero with prominent search input
 * - Featured Categories (top-level categories with counts)
 * - Latest Fatwas (6 most recent)
 * - Popular Fatwas (6 most viewed)
 * - Trusted Institutions (distinct dar_ul_ifta values)
 * - Platform Statistics
 */
export default function PlatformHomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const basePath = useBasePath()

  const fetchFatwas = useFatwaStore((state) => state.fetchFatwas)
  const latestFatwas = useFatwaStore((state) => state.latestFatwas)
  const popularFatwas = useFatwaStore((state) => state.popularFatwas)
  const totalCount = useFatwaStore((state) => state.totalCount)
  const institutionList = useFatwaStore((state) => state.institutionList)
  const loading = useFatwaStore((state) => state.loading)

  const { topLevelCategories } = useCategories()
  const { suggestions, isSearching } = useSearch(searchQuery)

  useEffect(() => {
    fetchFatwas()
  }, [fetchFatwas])

  const handleSearchSelect = useCallback(
    (suggestion) => {
      navigate(`${basePath}/${suggestion.slug}`)
    },
    [navigate, basePath]
  )

  const handleSearchSubmit = useCallback(
    (e) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
        navigate(`${basePath}/search?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    },
    [navigate, searchQuery, basePath]
  )

  const websiteSchema = generateWebSiteSchema({
    name: 'Hidayat Fatwa Platform',
    url: 'https://hidayat.org/fatwas',
    searchUrl: 'https://hidayat.org/fatwas/search?q={search_term_string}',
  })

  const totalCategories = topLevelCategories.length
  const totalInstitutions = institutionList.length

  // Top categories: filter out corrupted names, sort by count, take top 9
  const featuredCategories = useMemo(() => {
    return topLevelCategories
      .filter(cat => isValidCategoryName(cat.name))
      .sort((a, b) => b.count - a.count)
      .slice(0, 9)
  }, [topLevelCategories])

  if (loading && totalCount === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm font-medium">Loading Fatwa Platform...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <SEOHead
        title="Hidayat Fatwa Platform | Islamic Knowledge Base"
        description="Browse thousands of authentic Islamic fatwas organized by category. Search, read, and explore scholarly rulings from trusted institutions."
        canonicalUrl="/fatwas"
        ogType="website"
        structuredData={[websiteSchema]}
      />

      {/* Hero Section */}
      <motion.section
        className="bg-gradient-to-b from-green-700 to-green-800 text-white py-16 px-4"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1
            id="hero-heading"
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Islamic Fatwa Knowledge Platform
          </h1>
          <p className="text-green-100 text-base md:text-lg mb-8">
            Explore authentic Islamic rulings from trusted scholars and institutions
          </p>
          <div className="max-w-xl mx-auto" onKeyDown={handleSearchSubmit}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              suggestions={suggestions}
              onSelect={handleSearchSelect}
              placeholder="Search fatwas by topic, question, or fatwa number..."
              isSearching={isSearching}
            />
          </div>
          <p className="text-green-200 text-sm mt-4">
            <Link to={`${basePath}/search`} className="underline hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:rounded-sm">
              Advanced Search
            </Link>
          </p>
        </div>
      </motion.section>

      {/* Featured Categories Section */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-12"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        aria-labelledby="categories-heading"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="categories-heading" className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-green-600" size={24} aria-hidden="true" />
            Featured Categories
          </h2>
          <Link
            to={`${basePath}/categories`}
            className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:rounded-sm"
          >
            View All Categories →
          </Link>
        </div>
        {featuredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCategories.map((category) => {
              const isRtl = detectDirection(category.name) === 'rtl'
              return (
                <Link
                  key={category.name}
                  to={`${basePath}/category/${category.slug}`}
                  className="group block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-lg hover:border-green-300 hover:scale-[1.02] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                >
                  <h3
                    className={`text-sm font-semibold text-gray-800 mb-1 group-hover:text-green-700 transition-colors ${isRtl ? 'font-urdu text-right' : ''}`}
                    dir={isRtl ? 'rtl' : undefined}
                  >
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {category.count.toLocaleString()} {category.count === 1 ? 'fatwa' : 'fatwas'}
                  </p>
                </Link>
              )
            })}
          </div>
        ) : (
          !loading && (
            <p className="text-gray-600 text-sm">No categories available yet.</p>
          )
        )}
      </motion.section>

      {/* Latest Fatwas Section */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-12"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        aria-labelledby="latest-heading"
      >
        <h2 id="latest-heading" className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Clock className="text-green-600" size={24} aria-hidden="true" />
          Latest Fatwas
        </h2>
        {latestFatwas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestFatwas.map((fatwa) => (
              <FatwaCard key={fatwa.id} fatwa={fatwa} />
            ))}
          </div>
        ) : (
          !loading && (
            <p className="text-gray-600 text-sm">No fatwas published yet.</p>
          )
        )}
      </motion.section>

      {/* Popular Fatwas Section */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-12 bg-white rounded-lg shadow-sm mx-4"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        aria-labelledby="popular-heading"
      >
        <h2 id="popular-heading" className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="text-green-600" size={24} aria-hidden="true" />
          Popular Fatwas
        </h2>
        {popularFatwas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularFatwas.map((fatwa) => (
              <FatwaCard key={fatwa.id} fatwa={fatwa} />
            ))}
          </div>
        ) : (
          !loading && (
            <p className="text-gray-600 text-sm">No popular fatwas yet.</p>
          )
        )}
      </motion.section>

      {/* Trusted Institutions Section */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-12"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        aria-labelledby="institutions-heading"
      >
        <h2 id="institutions-heading" className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Building2 className="text-green-600" size={24} aria-hidden="true" />
          Trusted Institutions
        </h2>
        {institutionList.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {institutionList.map((institution) => (
              <span
                key={institution}
                className="inline-block bg-white rounded-full shadow-sm px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200"
              >
                {institution}
              </span>
            ))}
          </div>
        ) : (
          !loading && (
            <p className="text-gray-600 text-sm">No institutions listed yet.</p>
          )
        )}
      </motion.section>

      {/* Platform Statistics Section */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-12"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        aria-labelledby="stats-heading"
      >
        <h2 id="stats-heading" className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Platform at a Glance
        </h2>
        <PlatformStats
          totalFatwas={totalCount}
          totalCategories={totalCategories}
          totalInstitutions={totalInstitutions}
        />
      </motion.section>
    </main>
  )
}
