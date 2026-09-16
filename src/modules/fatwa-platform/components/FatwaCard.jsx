import { Link, useLocation } from 'react-router-dom'
import { useBasePath } from '../hooks/useBasePath'
import { detectDirection } from '../utils/rtlDetection'

/**
 * FatwaCard — displays a fatwa preview card with title,
 * category, and issuing institution. Links to the fatwa detail page.
 */
export function FatwaCard({ fatwa }) {
  const { title, slug, category_1, dar_ul_ifta, fatwa_ref, reference_number } = fatwa
  const basePath = useBasePath()
  const location = useLocation()
  const isRtl = detectDirection(title) === 'rtl'
  const isFromSearch = location.pathname.includes('/search')
  const refNum = fatwa_ref || reference_number

  return (
    <Link
      to={`${basePath}/${slug}`}
      state={isFromSearch ? { fromSearch: true } : undefined}
      className="block rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] shadow-xs p-5 bg-white dark:bg-[#0f1a14] hover:scale-[1.02] hover:shadow-lg hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <h3
        className={`text-sm font-display font-bold text-neutral-900 dark:text-neutral-100 leading-relaxed line-clamp-2 mb-3 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors ${isRtl ? 'font-urdu text-right' : ''}`}
        dir={isRtl ? 'rtl' : undefined}
      >
        {title}
      </h3>

      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-neutral-100 dark:border-[#1a2e23]">
        {refNum && (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40 font-mono">
            {refNum.startsWith('#') ? refNum : `#${refNum}`}
          </span>
        )}
        {category_1 && (
          <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 ${detectDirection(category_1) === 'rtl' ? 'font-urdu' : ''}`}>
            {category_1}
          </span>
        )}
        {dar_ul_ifta && (
          <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#14221b] text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-[#1a2e23]">
            {dar_ul_ifta}
          </span>
        )}
      </div>
    </Link>
  )
}
