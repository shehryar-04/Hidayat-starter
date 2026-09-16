import { Link, useLocation } from 'react-router-dom'
import { useBasePath } from '../hooks/useBasePath'
import { detectDirection } from '../utils/rtlDetection'

/**
 * Sanitize a server-generated snippet so only <mark> tags survive.
 */
function sanitizeSnippet(raw) {
  if (!raw || typeof raw !== 'string') return ''
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  return escaped
    .replace(/&lt;mark&gt;/g, '<mark class="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-semibold px-1 rounded">')
    .replace(/&lt;\/mark&gt;/g, '</mark>')
}

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
  const location = useLocation()

  if (error) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50" role="alert">
        <div className="text-red-500 mb-2 text-xl">⚠️</div>
        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
      </div>
    )
  }

  if (isSearching) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading search results">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-5 animate-pulse">
            <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 mb-3" />
            <div className="h-3.5 bg-neutral-100 dark:bg-neutral-800/60 rounded w-full mb-2" />
            <div className="h-3.5 bg-neutral-100 dark:bg-neutral-800/40 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (query && results.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23]">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-lg font-display font-bold text-neutral-800 dark:text-neutral-100 mb-2">No fatwas found</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
          We couldn't find any fatwas matching "{query}". Try searching with alternate keywords or category filters.
        </p>
        <div className="space-y-1.5 text-xs text-neutral-400">
          <p>• Use broader or more general terms</p>
          <p>• Try searching in Urdu or Arabic script</p>
          <p>• Check for spelling variations</p>
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
      <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">
        {total.toLocaleString()} fatwa result{total !== 1 ? 's' : ''} found
      </p>

      {/* Results list */}
      <div className="space-y-4">
        {results.map((result, index) => {
          const titleRtl = detectDirection(result.title) === 'rtl'
          const position = startIndex + index

          return (
            <Link
              key={result.id}
              to={result.slug ? `${basePath}/${result.slug}` : `${basePath}/id/${result.id}`}
              state={{ fromSearch: true, searchQuery: query }}
              onClick={() => onResultClick?.(result.id, position)}
              className="block bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] shadow-xs p-5 hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {/* Title */}
              <h3
                className={`text-base font-display font-bold text-neutral-900 dark:text-neutral-100 mb-2 leading-relaxed hover:text-primary-600 dark:hover:text-emerald-400 transition-colors ${titleRtl ? 'text-right font-urdu' : ''}`}
                dir={titleRtl ? 'rtl' : undefined}
              >
                {result.title}
              </h3>

              {/* Snippet: Question */}
              {result.snippet_question && (
                <p
                  className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mb-2 line-clamp-2 leading-relaxed"
                  dir={detectDirection(result.snippet_question) === 'rtl' ? 'rtl' : undefined}
                  dangerouslySetInnerHTML={{ __html: sanitizeSnippet(result.snippet_question) }}
                />
              )}

              {/* Snippet: Answer */}
              {result.snippet_answer && (
                <p
                  className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2 leading-relaxed"
                  dir={detectDirection(result.snippet_answer) === 'rtl' ? 'rtl' : undefined}
                  dangerouslySetInnerHTML={{ __html: sanitizeSnippet(result.snippet_answer) }}
                />
              )}

              {/* Metadata row */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-neutral-100 dark:border-[#1a2e23]">
                {result.category_1 && (
                  <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 ${detectDirection(result.category_1) === 'rtl' ? 'font-urdu' : ''}`}>
                    {result.category_1}
                  </span>
                )}
                {result.category_2 && (
                  <span className={`inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-[#14221b] text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-[#1a2e23] ${detectDirection(result.category_2) === 'rtl' ? 'font-urdu' : ''}`}>
                    {result.category_2}
                  </span>
                )}
                {result.dar_ul_ifta && (
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#14221b] text-neutral-500 dark:text-neutral-400">
                    {result.dar_ul_ifta}
                  </span>
                )}
                {result.combined_score != null && result.combined_score > 0 && (
                  <span className="text-[10px] text-neutral-400 ml-auto font-mono">
                    {result.combined_score >= 0.66 ? 'Strong match' : result.combined_score >= 0.33 ? 'Good match' : 'Related'}
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
