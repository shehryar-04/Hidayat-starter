import { Link, useLocation } from 'react-router-dom'
import { useBasePath } from '../hooks/useBasePath'
import { detectDirection } from '../utils/rtlDetection'

/**
 * FatwaCard — displays a fatwa preview card with title,
 * category, and issuing institution. Links to the fatwa detail page.
 */
export function FatwaCard({ fatwa }) {
  const { title, slug, category_1, dar_ul_ifta } = fatwa
  const basePath = useBasePath()
  const location = useLocation()
  const isRtl = detectDirection(title) === 'rtl'
  const isFromSearch = location.pathname.includes('/search')

  return (
    <Link
      to={`${basePath}/${slug}`}
      state={isFromSearch ? { fromSearch: true } : undefined}
      className="block rounded-xl border border-gray-200 shadow-sm p-5 bg-white hover:scale-[1.02] hover:shadow-lg hover:border-green-300 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
    >
      <h3
        className={`text-sm font-semibold text-gray-800 leading-relaxed line-clamp-2 mb-3 ${isRtl ? 'font-urdu text-right' : ''}`}
        dir={isRtl ? 'rtl' : undefined}
      >
        {title}
      </h3>

      <div className="flex items-center gap-2 flex-wrap">
        {category_1 && (
          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 ${detectDirection(category_1) === 'rtl' ? 'font-urdu' : ''}`}>
            {category_1}
          </span>
        )}
        {dar_ul_ifta && (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {dar_ul_ifta}
          </span>
        )}
      </div>
    </Link>
  )
}
