import { Link } from 'react-router-dom'
import { FatwaCard } from './FatwaCard'

/**
 * Highlights matching text within a string by wrapping matched portions in <strong>.
 *
 * @param {{ text: string, query: string }} props
 * @returns {JSX.Element}
 */
function HighlightMatch({ text, query }) {
  if (!query || !query.trim()) {
    return <span>{text}</span>
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <strong key={i} className="font-semibold text-green-700">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

/**
 * SearchResults — Displays search results with highlighted matching terms,
 * filter controls for category_1 and dar_ul_ifta, and an empty state with
 * suggestions when no results are found.
 *
 * @param {{
 *   results: Array<{ id: string, title: string, slug: string, reference_number: string, category_1: string, dar_ul_ifta: string }>,
 *   query: string,
 *   filters: { category_1?: string, dar_ul_ifta?: string },
 *   onFilterChange: (filters: { category_1?: string, dar_ul_ifta?: string }) => void,
 *   categories: string[],
 *   institutions: string[]
 * }} props
 * @returns {JSX.Element}
 */
export default function SearchResults({
  results,
  query,
  filters,
  onFilterChange,
  categories = [],
  institutions = [],
}) {
  const hasQuery = query && query.trim().length > 0
  const hasResults = results.length > 0

  return (
    <div className="w-full">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <label
            htmlFor="filter-category"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category_1 || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                category_1: e.target.value || undefined,
              })
            }
            className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label
            htmlFor="filter-institution"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Institution
          </label>
          <select
            id="filter-institution"
            value={filters.dar_ul_ifta || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                dar_ul_ifta: e.target.value || undefined,
              })
            }
            className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Institutions</option>
            {institutions.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results or Empty State */}
      {hasResults ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            {results.length} result{results.length !== 1 ? 's' : ''} found
            {hasQuery && (
              <>
                {' '}
                for &ldquo;<HighlightMatch text={query} query={query} />&rdquo;
              </>
            )}
          </p>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((fatwa) => (
              <FatwaCard key={fatwa.id || fatwa.slug} fatwa={fatwa} />
            ))}
          </div>
        </div>
      ) : hasQuery ? (
        <div className="text-center py-12 px-4">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            No results found
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            We couldn&apos;t find any fatwas matching &ldquo;{query}&rdquo;.
            Try different keywords or check the spelling.
          </p>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Suggestions:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use broader or more general terms</li>
              <li>• Check for spelling mistakes</li>
              <li>• Try searching in Arabic or Urdu</li>
            </ul>

            <div className="pt-4">
              <Link
                to="/fatwas"
                className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:rounded-sm"
              >
                <span>Browse categories instead</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
