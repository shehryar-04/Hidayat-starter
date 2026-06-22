import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Building2, Search } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import PlatformStats from '../components/PlatformStats'
import { useFatwaStore } from '../stores/fatwaStore'
import { useCategories } from '../hooks/useCategories'
import { useBasePath } from '../hooks/useBasePath'
import { generateWebSiteSchema } from '../utils/structuredData'
import { isValidCategoryName } from '../utils/categoryFilter'
import { detectDirection } from '../utils/rtlDetection'

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export default function PlatformHomePage() {
  const basePath = useBasePath()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const fetchFatwas = useFatwaStore((state) => state.fetchFatwas)
  const totalCount = useFatwaStore((state) => state.totalCount)
  const institutionList = useFatwaStore((state) => state.institutionList)
  const loading = useFatwaStore((state) => state.loading)

  const { topLevelCategories } = useCategories()

  useEffect(() => {
    fetchFatwas()
  }, [fetchFatwas])

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`${basePath}/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }, [searchQuery, navigate, basePath])

  const websiteSchema = generateWebSiteSchema({
    name: 'Hidayat Fatwa Platform',
    url: 'https://hidayat.org/fatwas',
    searchUrl: 'https://hidayat.org/fatwas/search?q={search_term_string}',
  })

  const totalCategories = topLevelCategories.length
  const totalInstitutions = institutionList.length

  // Top categories: filter out corrupted names, sort by count, take top 12
  const featuredCategories = useMemo(() => {
    return topLevelCategories
      .filter(cat => isValidCategoryName(cat.name))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [topLevelCategories])

  if (loading && totalCount === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        {/* Show search bar immediately even while loading */}
        <section className="bg-gradient-to-b from-green-700 to-green-800 text-white py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Islamic Fatwa Knowledge Platform
            </h1>
            <p className="text-green-100 text-base md:text-lg mb-6">
              Explore authentic Islamic rulings from trusted scholars and institutions
            </p>
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 70,000+ fatwas..."
                className="w-full h-14 rounded-xl border-0 bg-white shadow-lg pl-12 pr-4 text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
                aria-label="Search fatwas"
              />
            </form>
          </div>
        </section>

        {/* Skeleton loading state */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="px-5 py-3 space-y-2">
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
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

      {/* Hero Section with Search */}
      <motion.section
        className="bg-gradient-to-b from-green-700 to-green-800 text-white py-14 px-4"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 id="hero-heading" className="text-3xl md:text-4xl font-bold mb-3">
            Islamic Fatwa Knowledge Platform
          </h1>
          <p className="text-green-100 text-base md:text-lg">
            Explore authentic Islamic rulings from trusted scholars and institutions
          </p>

          {/* Prominent Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 70,000+ fatwas..."
              className="w-full h-14 rounded-xl border-0 bg-white shadow-lg pl-12 pr-4 text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="Search fatwas"
            />
          </form>

          <p className="text-green-200 text-sm mt-4">
            {totalCount.toLocaleString()} fatwas across {totalCategories} categories
          </p>
        </div>
      </motion.section>

      {/* Featured Categories with Subcategories */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-10"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        aria-labelledby="categories-heading"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 id="categories-heading" className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-green-600" size={24} aria-hidden="true" />
            Browse by Category
          </h2>
          <Link
            to={`${basePath}/categories`}
            className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
          >
            View All Categories →
          </Link>
        </div>

        {featuredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredCategories.map((category) => {
              const isRtl = detectDirection(category.name) === 'rtl'
              const subcategories = Object.values(category.children || {})
                .filter(sub => isValidCategoryName(sub.name))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)

              return (
                <div
                  key={category.name}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Category Header */}
                  <Link
                    to={`${basePath}/category/${category.slug}`}
                    className="block px-5 py-4 border-b border-gray-100 hover:bg-green-50 transition-colors"
                  >
                    <h3
                      className={`text-base font-bold text-gray-800 hover:text-green-700 transition-colors ${isRtl ? 'font-urdu text-right' : ''}`}
                      dir={isRtl ? 'rtl' : undefined}
                    >
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {category.count.toLocaleString()} fatwas
                    </p>
                  </Link>

                  {/* Subcategories List */}
                  {subcategories.length > 0 && (
                    <div className="px-5 py-3 space-y-1">
                      {subcategories.map((sub) => {
                        const isSubRtl = detectDirection(sub.name) === 'rtl'
                        return (
                          <Link
                            key={sub.name}
                            to={`${basePath}/category/${category.slug}/${sub.slug}`}
                            className={`flex items-center justify-between py-1.5 text-sm text-gray-600 hover:text-green-700 transition-colors ${isSubRtl ? 'font-urdu flex-row-reverse' : ''}`}
                            dir={isSubRtl ? 'rtl' : undefined}
                          >
                            <span className="truncate">{sub.name}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{sub.count}</span>
                          </Link>
                        )
                      })}
                      {Object.keys(category.children).length > 5 && (
                        <Link
                          to={`${basePath}/category/${category.slug}`}
                          className="block text-xs text-green-600 hover:text-green-700 pt-1 font-medium"
                        >
                          + {Object.keys(category.children).length - 5} more →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          !loading && (
            <p className="text-gray-600 text-sm">No categories available yet.</p>
          )
        )}
      </motion.section>

      {/* Trusted Institutions Section */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-10"
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
            {institutionList.map((institution) => {
              const isRtl = detectDirection(institution) === 'rtl'
              return (
                <span
                  key={institution}
                  className={`inline-block bg-white rounded-full shadow-sm px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 ${isRtl ? 'font-urdu' : ''}`}
                  dir={isRtl ? 'rtl' : undefined}
                >
                  {institution}
                </span>
              )
            })}
          </div>
        ) : (
          !loading && (
            <p className="text-gray-600 text-sm">No institutions listed yet.</p>
          )
        )}
      </motion.section>

      {/* Platform Statistics Section */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-10"
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
