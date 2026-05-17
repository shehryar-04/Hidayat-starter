import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import SearchInput from '../components/SearchInput'
import SearchResults from '../components/SearchResults'
import { useSearch } from '../hooks/useSearch'
import { useFatwaStore } from '../stores/fatwaStore'
import { useCategories } from '../hooks/useCategories'

/**
 * SearchPage — Full search page with autocomplete input, filter controls,
 * highlighted results, and empty state with suggestions.
 *
 * Features:
 * - Reads/writes `q` query param from URL via useSearchParams
 * - Filters by category_1 and dar_ul_ifta
 * - Autocomplete suggestions navigate to fatwa detail page on select
 * - SEOHead with search-specific meta tags
 * - Centered max-w-4xl layout
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Read initial query from URL
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState({
    category_1: undefined,
    dar_ul_ifta: undefined,
  })

  // Fetch fatwas on mount
  const fetchFatwas = useFatwaStore((state) => state.fetchFatwas)
  const institutionList = useFatwaStore((state) => state.institutionList)

  useEffect(() => {
    fetchFatwas()
  }, [fetchFatwas])

  // Get categories for filter dropdown
  const { topLevelCategories } = useCategories()
  const categoryNames = topLevelCategories.map((cat) => cat.name)

  // Use search hook with query and filters
  const { results, suggestions, isSearching } = useSearch(query, {
    category_1: filters.category_1,
    dar_ul_ifta: filters.dar_ul_ifta,
  })

  // Sync query to URL param
  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value)
      if (value.trim()) {
        setSearchParams({ q: value }, { replace: true })
      } else {
        setSearchParams({}, { replace: true })
      }
    },
    [setSearchParams]
  )

  // Navigate to fatwa detail page when a suggestion is selected
  const handleSuggestionSelect = useCallback(
    (suggestion) => {
      navigate(`/fatwas/${suggestion.slug}`)
    },
    [navigate]
  )

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <SEOHead
        title="Search Fatwas | Hidayat Fatwa Platform"
        description="Search across thousands of authentic Islamic fatwas. Find rulings on worship, transactions, family law, and more from trusted scholars."
        canonicalUrl="https://hidayat.com/fatwas/search"
        ogType="website"
      />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Page Header */}
        <header className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Search Fatwas
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Find authentic Islamic rulings by keyword, topic, or fatwa number
          </p>
        </header>

        {/* Search Input with Autocomplete */}
        <div className="mb-8">
          <SearchInput
            value={query}
            onChange={handleQueryChange}
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
            placeholder="Search by keyword, topic, or fatwa number..."
            isSearching={isSearching}
          />
        </div>

        {/* Search Results with Filters */}
        <SearchResults
          results={results}
          query={query}
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categoryNames}
          institutions={institutionList}
        />
      </div>
    </main>
  )
}
