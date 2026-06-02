import { detectDirection } from '../utils/rtlDetection'

/**
 * SearchFilters — Faceted filter panel for search results.
 *
 * Displays category and institution facets with counts.
 * Allows single-select filtering that updates search results.
 */
export default function SearchFilters({
  facets = {},
  activeFilters = {},
  onFilterChange,
  totalResults = 0,
}) {
  const categoryFacets = facets.category || []
  const institutionFacets = facets.institution || []

  const handleCategoryClick = (value) => {
    onFilterChange({
      ...activeFilters,
      category_1: activeFilters.category_1 === value ? undefined : value,
    })
  }

  const handleInstitutionClick = (value) => {
    onFilterChange({
      ...activeFilters,
      dar_ul_ifta: activeFilters.dar_ul_ifta === value ? undefined : value,
    })
  }

  const handleClearAll = () => {
    onFilterChange({})
  }

  const hasActiveFilters = activeFilters.category_1 || activeFilters.dar_ul_ifta

  if (categoryFacets.length === 0 && institutionFacets.length === 0) {
    return null
  }

  return (
    <aside className="space-y-6" aria-label="Search filters">
      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Active Filters
          </span>
          <button
            onClick={handleClearAll}
            className="text-xs text-green-600 hover:text-green-700 font-medium min-h-[44px] flex items-center"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Category facets */}
      {categoryFacets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
          <ul className="space-y-1">
            {categoryFacets.map(({ value, count }) => {
              const isActive = activeFilters.category_1 === value
              const isRtl = detectDirection(value) === 'rtl'
              return (
                <li key={value}>
                  <button
                    onClick={() => handleCategoryClick(value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px]
                      ${isActive
                        ? 'bg-green-50 text-green-700 font-medium border border-green-200'
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                      ${isRtl ? 'flex-row-reverse text-right font-urdu' : ''}`}
                    dir={isRtl ? 'rtl' : undefined}
                    aria-pressed={isActive}
                  >
                    <span className="truncate">{value}</span>
                    <span className={`text-xs flex-shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'} ${isRtl ? 'mr-2' : 'ml-2'}`}>
                      {count.toLocaleString()}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Institution facets */}
      {institutionFacets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Institutions</h3>
          <ul className="space-y-1">
            {institutionFacets.map(({ value, count }) => {
              const isActive = activeFilters.dar_ul_ifta === value
              const isRtl = detectDirection(value) === 'rtl'
              return (
                <li key={value}>
                  <button
                    onClick={() => handleInstitutionClick(value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px]
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                      ${isRtl ? 'flex-row-reverse text-right font-urdu' : ''}`}
                    dir={isRtl ? 'rtl' : undefined}
                    aria-pressed={isActive}
                  >
                    <span className="truncate">{value}</span>
                    <span className={`text-xs flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'} ${isRtl ? 'mr-2' : 'ml-2'}`}>
                      {count.toLocaleString()}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </aside>
  )
}
