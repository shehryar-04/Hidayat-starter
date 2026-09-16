import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Building2, Search, Heart, Sparkles, Compass } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import PlatformStats from '../components/PlatformStats'
import { useFatwaStore } from '../stores/fatwaStore'
import { useCategories } from '../hooks/useCategories'
import { useBasePath } from '../hooks/useBasePath'
import { generateWebSiteSchema } from '../utils/structuredData'
import { isValidCategoryName } from '../utils/categoryFilter'
import { detectDirection } from '../utils/rtlDetection'

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
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

  return (
    <div className="space-y-8">
      <SEOHead
        title="Hidayat Fatwa Platform | Authentic Islamic Knowledge Base"
        description="Browse thousands of authentic Islamic fatwas organized by category. Search, read, and explore scholarly rulings from trusted institutions."
        canonicalUrl="/fatwas"
        ogType="website"
        structuredData={[websiteSchema]}
      />

      {/* Hero Section with Search */}
      <motion.section
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 dark:from-[#0d2217] dark:via-[#091710] dark:to-[#040c08] border border-primary-600/30 dark:border-[#1a2e23] text-white p-8 sm:p-12 shadow-lg"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-emerald-500/10 border border-white/20 dark:border-emerald-500/20 text-xs font-semibold text-emerald-100 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Authenticated Islamic Knowledge Base</span>
          </div>

          <h1 id="hero-heading" className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Islamic Fatwa Platform
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/80 max-w-2xl mx-auto">
            Search and explore scholarly rulings and verified legal verdicts across traditional Sunni jurisprudence.
          </p>

          {/* Prominent Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 70,000+ fatwas by topic, question, or keyword..."
              className="w-full h-13 sm:h-14 rounded-2xl border border-white/20 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] shadow-xl pl-12 pr-28 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Search fatwas"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Quick links & count */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-emerald-100/70">
            <span>{totalCount.toLocaleString()} fatwas indexed</span>
            <span>•</span>
            <Link
              to={`${basePath}/saved`}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              <Heart size={13} className="text-red-400" /> Saved Fatwas
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Featured Categories Grid */}
      <motion.section
        className="space-y-6"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        aria-labelledby="categories-heading"
      >
        <div className="flex items-center justify-between">
          <h2 id="categories-heading" className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-emerald-400 flex items-center justify-center border border-primary-100 dark:border-emerald-900/30">
              <BookOpen className="w-4 h-4" />
            </span>
            Browse by Category
          </h2>
          <Link
            to={`${basePath}/categories`}
            className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
          >
            View All Categories →
          </Link>
        </div>

        {loading && totalCount === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-5 animate-pulse">
                <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-3" />
                <div className="h-3 w-1/3 bg-neutral-100 dark:bg-neutral-800/60 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-neutral-100 dark:bg-neutral-800/40 rounded" />
                  <div className="h-3.5 w-5/6 bg-neutral-100 dark:bg-neutral-800/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCategories.map((category) => {
              const isRtl = detectDirection(category.name) === 'rtl'
              const subcategories = Object.values(category.children || {})
                .filter(sub => isValidCategoryName(sub.name))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)

              return (
                <div
                  key={category.name}
                  className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] shadow-xs overflow-hidden hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 flex flex-col"
                >
                  {/* Category Header */}
                  <Link
                    to={`${basePath}/category/${category.slug}`}
                    className="block px-5 py-4 border-b border-neutral-100 dark:border-[#1a2e23] hover:bg-neutral-50 dark:hover:bg-[#14221b] transition-colors"
                  >
                    <h3
                      className={`text-base font-bold text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-emerald-400 transition-colors ${isRtl ? 'font-urdu text-right' : ''}`}
                      dir={isRtl ? 'rtl' : undefined}
                    >
                      {category.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {category.count.toLocaleString()} fatwas
                    </p>
                  </Link>

                  {/* Subcategories List */}
                  {subcategories.length > 0 && (
                    <div className="p-4 space-y-1 flex-1">
                      {subcategories.map((sub) => {
                        const isSubRtl = detectDirection(sub.name) === 'rtl'
                        return (
                          <Link
                            key={sub.name}
                            to={`${basePath}/category/${category.slug}/${sub.slug}`}
                            className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-[#14221b] hover:text-primary-600 dark:hover:text-emerald-400 transition-colors ${isSubRtl ? 'font-urdu flex-row-reverse' : ''}`}
                            dir={isSubRtl ? 'rtl' : undefined}
                          >
                            <span className="truncate">{sub.name}</span>
                            <span className="text-xs text-neutral-400 flex-shrink-0 ml-2 font-mono">{sub.count}</span>
                          </Link>
                        )
                      })}
                      {Object.keys(category.children).length > 5 && (
                        <Link
                          to={`${basePath}/category/${category.slug}`}
                          className="block text-xs text-primary-600 dark:text-emerald-400 hover:underline pt-2 font-medium px-2"
                        >
                          + {Object.keys(category.children).length - 5} more categories →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-neutral-500 text-sm">No categories available yet.</p>
        )}
      </motion.section>
    </div>
  )
}
