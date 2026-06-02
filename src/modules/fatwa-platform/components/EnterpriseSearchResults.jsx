import { Link } from 'react-router-dom'
import { useBasePath } from '../hooks/useBasePath'
import { detectDirection } from '../utils/rtlDetection'
import { slugify } from '../utils/slugGenerator'

/**
 * EnterpriseSearchResults — Displays search results with highlighted snippets,
 * category paths, relevance indicators, and click tracking.
 */
export default function EnterpriseSearchResults({
  results = [],
  query = '',
  total = 0,
  isSearching = false,
  error = null,
  onResultClick,
  page = 1,
  limit = 20,
}) {
  const basePath = useBasePath()

  if (error) {
    return (
      <div className="text-center py-12 px-4" role="alert">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (isSearching) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading search results">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (query && results.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">No results found</h2>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          We couldn't find any fatwas matching "{query}". Try different keywords or check the spelling.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>• Use broader or more general terms</p>
          <p>• Try searching in Urdu or Arabic</p>
          <p>• Check for spelling mistakes</p>
        </div>
      </div>
    )
  }

  if (!query || results.length === 0) {
    return null
  }

  const startIndex = (page - 1) * limit

  return (
    <div>
      {/* Results count */}
      <p className="text-sm text-gray-600 mb-4">
        {total.toLocaleString()} result{total !== 1 ? 's' : ''} found
      </p>

      {/* Results list */}
      <div className="space-y-4">
        {results.map((result, index) => {
          const titleRtl = detectDirection(result.title) === 'rtl'
          const position = startIndex + index

          return (
            <Link
              key={result.id}
              to={`${basePath}/${result.slug || slugify(result.title) || result.id}`}
              onClick={() => onResultClick?.(result.id, position)}
              className="block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-green-300 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              {/* Title */}
              <h3
                className={`text-base font-semibold text-gray-900 mb-2 leading-relaxed ${titleRtl ? 'text-right font-urdu' : ''}`}
                dir={titleRtl ? 'rtl' : undefined}
              >
                {result.title}
              </h3>

              {/* Snippet: Question */}
              {result.snippet_question && (
                <p
                  className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed"
                  dir={detectDirection(result.snippet_question) === 'rtl' ? 'rtl' : undefined}
                  dangerouslySetInnerHTML={{ __html: result.snippet_question }}
                />
              )}

              {/* Snippet: Answer */}
              {result.snippet_answer && (
                <p
                  className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed"
                  dir={detectDirection(result.snippet_answer) === 'rtl' ? 'rtl' : undefined}
                  dangerouslySetInnerHTML={{ __html: result.snippet_answer }}
                />
              )}

              {/* Metadata row */}
              <div className="flex items-center gap-2 flex-wrap">
                {result.category_1 && (
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 ${detectDirection(result.category_1) === 'rtl' ? 'font-urdu' : ''}`}>
                    {result.category_1}
                  </span>
                )}
                {result.category_2 && (
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50/60 text-green-600 ${detectDirection(result.category_2) === 'rtl' ? 'font-urdu' : ''}`}>
                    {result.category_2}
                  </span>
                )}
                {result.dar_ul_ifta && (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {result.dar_ul_ifta}
                  </span>
                )}
                {result.rank != null && result.rank > 0 && (
                  <span className="text-[10px] text-gray-400 ml-auto">
                    Relevance: {(result.rank * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
