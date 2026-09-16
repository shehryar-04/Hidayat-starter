import { useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import EnterpriseSearchBar from '../components/EnterpriseSearchBar'
import EnterpriseSearchResults from '../components/EnterpriseSearchResults'
import SearchFilters from '../components/SearchFilters'
import { useEnterpriseSearch } from '../hooks/useEnterpriseSearch'
import { useBasePath } from '../hooks/useBasePath'

export default function EnterpriseSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const basePath = useBasePath()

  const initialQuery = searchParams.get('q') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10)

  const [query, setQuery] = useState(initialQuery)
  const [page, setPage] = useState(initialPage)
  const [filters, setFilters] = useState({})
  const LIMIT = 20

  // Enterprise search hook — server-side search
  const {
    results,
    suggestions,
    facets,
    total,
    isSearching,
    isSuggesting,
    error,
    logClick,
    hasMore,
  } = useEnterpriseSearch(query, { limit: LIMIT, page, filters })

  // Sync query to URL
  const handleQueryChange = useCallback((value) => {
    setQuery(value)
    setPage(1)
    if (value.trim()) {
      setSearchParams({ q: value, page: '1' }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [setSearchParams])

  // Submit search (Enter key or button)
  const handleSubmit = useCallback((value) => {
    if (value && value.trim()) {
      setSearchParams({ q: value.trim(), page: '1' }, { replace: true })
    }
  }, [setSearchParams])

  // Navigate to fatwa detail on suggestion select, or search for the term
  const handleSuggestionSelect = useCallback((suggestion) => {
    if (suggestion.slug) {
      navigate(`${basePath}/${suggestion.slug}`)
    } else {
      const term = suggestion.term || suggestion.title || ''
      handleQueryChange(term)
    }
  }, [navigate, basePath, handleQueryChange])

  // Filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  // Pagination
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage)
    setSearchParams({ q: query, page: String(newPage) }, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [query, setSearchParams])

  // Click tracking
  const handleResultClick = useCallback((fatwaId, position) => {
    logClick(fatwaId, position)
  }, [logClick])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <SEOHead
        title="Search Fatwas | Hidayat Islamic Knowledge Platform"
        description="Search across 70,000+ authentic Islamic fatwas in Urdu, Arabic, and English. Find rulings on worship, transactions, family law, and more."
        canonicalUrl="https://hidayat.org/fatwas/search"
        ogType="website"
      />

      {/* Search Header Bar */}
      <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
        <EnterpriseSearchBar
          value={query}
          onChange={handleQueryChange}
          onSubmit={handleSubmit}
          suggestions={suggestions}
          onSuggestionSelect={handleSuggestionSelect}
          isSuggesting={isSuggesting}
          placeholder="Search 70,000+ fatwas in Urdu, Arabic, English..."
        />
      </div>

      {/* Content area */}
      <div>
        {query.trim() ? (
          <div className="lg:flex lg:gap-8 items-start">
            {/* Sidebar filters — desktop only */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl p-4 shadow-xs">
                <SearchFilters
                  facets={facets}
                  activeFilters={filters}
                  onFilterChange={handleFilterChange}
                  totalResults={total}
                />
              </div>
            </div>

            {/* Main results area */}
            <div className="flex-1 min-w-0">
              {/* Mobile filters */}
              <div className="lg:hidden mb-4">
                <details className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-4 shadow-xs">
                  <summary className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                    Filter Results {(filters.category_1 || filters.dar_ul_ifta) && '(active)'}
                  </summary>
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-[#1a2e23]">
                    <SearchFilters
                      facets={facets}
                      activeFilters={filters}
                      onFilterChange={handleFilterChange}
                      totalResults={total}
                    />
                  </div>
                </details>
              </div>

              {/* Results */}
              <EnterpriseSearchResults
                results={results}
                query={query}
                total={total}
                isSearching={isSearching}
                error={error}
                onResultClick={handleResultClick}
                page={page}
                limit={LIMIT}
              />

              {/* Pagination */}
              {totalPages > 1 && !isSearching && results.length > 0 && (
                <nav className="flex items-center justify-center gap-3 mt-8" aria-label="Search results pagination">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200/80 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#14221b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <span className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 px-3">
                    Page <strong className="text-neutral-900 dark:text-white">{page}</strong> of {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasMore}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200/80 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#14221b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              )}
            </div>
          </div>
        ) : (
          /* Empty state — no query */
          <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-3xl p-8 sm:p-16 text-center shadow-xs">
            <div className="text-5xl mb-4">⚖️</div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2">
              Search Islamic Fatwas & Rulings
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-8">
              Search across 70,000+ authentic Islamic fatwas from verified seminaries and muftis.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              {['نماز', 'طلاق', 'زکوٰۃ', 'روزہ', 'نکاح', 'وراثت', 'تجارت'].map(term => (
                <button
                  key={term}
                  onClick={() => handleQueryChange(term)}
                  className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 font-urdu hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
