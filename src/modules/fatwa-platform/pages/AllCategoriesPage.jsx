import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useFatwaStore } from '../stores/fatwaStore'
import { useCategories } from '../hooks/useCategories'
import { useBasePath } from '../hooks/useBasePath'
import { detectDirection } from '../utils/rtlDetection'
import SEOHead from '../components/SEOHead'
import { isValidCategoryName } from '../utils/categoryFilter'

/**
 * AllCategoriesPage — Shows all categories sorted by fatwa count.
 */
export default function AllCategoriesPage() {
  const fetchFatwas = useFatwaStore((state) => state.fetchFatwas)
  const loading = useFatwaStore((state) => state.loading)
  const { topLevelCategories } = useCategories()
  const basePath = useBasePath()

  useEffect(() => {
    fetchFatwas()
  }, [fetchFatwas])

  // Filter out corrupted names and sort by count (most fatwas first)
  const sortedCategories = useMemo(() => {
    return topLevelCategories
      .filter(cat => isValidCategoryName(cat.name))
      .sort((a, b) => b.count - a.count)
  }, [topLevelCategories])

  if (loading && sortedCategories.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm font-medium">Loading categories...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <SEOHead
        title="All Categories | Hidayat Fatwa Platform"
        description="Browse all fatwa categories on Hidayat Fatwa Platform."
        canonicalUrl="/fatwas/categories"
        ogType="website"
      />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="text-green-600" size={28} />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Categories</h1>
          <span className="ml-auto text-sm text-gray-500">{sortedCategories.length} categories</span>
        </div>

        {/* Category Grid */}
        {sortedCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCategories.map((category) => {
              const isRtl = detectDirection(category.name) === 'rtl'
              return (
                <Link
                  key={category.name}
                  to={`${basePath}/category/${category.slug}`}
                  className="group block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-lg hover:border-green-300 hover:scale-[1.02] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                >
                  <h3
                    className={`text-base font-semibold text-gray-800 mb-2 group-hover:text-green-700 transition-colors ${isRtl ? 'font-urdu text-right' : ''}`}
                    dir={isRtl ? 'rtl' : undefined}
                  >
                    {category.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {category.count.toLocaleString()} {category.count === 1 ? 'fatwa' : 'fatwas'}
                    </p>
                    {Object.keys(category.children).length > 0 && (
                      <span className="text-xs text-gray-400">
                        {Object.keys(category.children).length} subcategories
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p>No categories available yet.</p>
          </div>
        )}
      </div>
    </main>
  )
}
