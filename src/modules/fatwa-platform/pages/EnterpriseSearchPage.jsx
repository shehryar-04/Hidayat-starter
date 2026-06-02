import { useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import EnterpriseSearchBar from '../components/EnterpriseSearchBar'
import EnterpriseSearchResults from '../components/EnterpriseSearchResults'
import SearchFilters from '../components/SearchFilters'
import { useEnterpriseSearch } from '../hooks/useEnterpriseSearch'
import { useBasePath } from '../hooks/useBasePath'

/**
 * EnterpriseSearchPage — Full-featured search page with server-side
 * PostgreSQL full-text search across 70,000+ fatwas.
 *
 * Features:
 * - Server-side full-text search (replaces client-side Fuse.js)
 * - Autocomplete suggestions via trigram similarity
 * - Faceted filters (category, institution) with counts
 * - Pagination
 * - Search analytics (query logging, click tracking)
 * - Highlighted snippets in results
 * - RTL support for Urdu/Arabic
 * - Responsive layout with sidebar filters on desktop
 */
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
      // Precomputed suggestion — use term as search query
      const term = suggestion.term || suggestion.title || ''
      handleQueryChange(term)
      if (onSubmit) handleSubmit(term)
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
    <main className="min-h-screen bg-gray-50">
      <SEOHead
        title="Search Fatwas | Hidayat Islamic Knowledge Platform"
        description="Search across 70,000+ authentic Islamic fatwas in Urdu, Arabic, and English. Find rulings on worship, transactions, family law, and more."
        canonicalUrl="https://hidayat.org/fatwas/search"
        ogType="website"
      />

      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] sm:top-[65px] z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
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
      </div>

      {/* Content area */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {query.trim() ? (
          <div className="lg:flex lg:gap-8">
            {/* Sidebar filters — desktop only */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-[160px]">
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
                <details className="bg-white rounded-lg border border-gray-200 p-3">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                    Filters {(filters.category_1 || filters.dar_ul_ifta) && '(active)'}
                  </summary>
                  <div className="mt-3 pt-3 border-t border-gray-100">
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
                <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Search results pagination">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <span className="text-sm text-gray-600 px-3">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasMore}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] transition-colors"
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
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚖️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Search Islamic Fatwas
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto mb-8">
              Search across 70,000+ authentic Islamic fatwas from trusted scholars and institutions.
              Supports Urdu, Arabic, and English.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              {['نماز', 'طلاق', 'زکوٰۃ', 'روزہ', 'نکاح', 'وراثت', 'تجارت'].map(term => (
                <button
                  key={term}
                  onClick={() => handleQueryChange(term)}
                  className="px-4 py-2 rounded-full bg-green-50 text-green-700 font-urdu hover:bg-green-100 transition-colors min-h-[44px]"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
