import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import SiteFooter from '../../../app/SiteFooter'

/**
 * Shared layout primitives for the institutional (company profile) pages.
 * These pages are static content pages rendered inside the AppShell, so they
 * supply their own footer to keep site-wide navigation reachable.
 */

/** Sets document.title for a content page. */
export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · Hidayat`
    return () => { document.title = previous }
  }, [title])
}

/** Dark primary hero band used at the top of every institutional page. */
export function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="relative overflow-hidden bg-primary-800 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700"
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
        {eyebrow && (
          <span className="block text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-primary-200 mb-3">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display font-bold text-2xl sm:text-4xl leading-tight max-w-3xl">{title}</h1>
        {description && (
          <p className="mt-4 text-sm sm:text-lg text-white/80 max-w-3xl leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </section>
  )
}

/** Standard content section with optional heading + eyebrow. */
export function Section({ eyebrow, title, description, children, tone = 'white', className = '' }) {
  const bg = tone === 'muted' ? 'bg-neutral-50' : 'bg-white'
  return (
    <section className={`py-12 sm:py-20 ${bg} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {(eyebrow || title || description) && (
          <div className="mb-8 sm:mb-12 max-w-3xl">
            {eyebrow && (
              <span className="block text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-primary-500 mb-2">
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 className="font-display font-bold text-xl sm:text-3xl text-neutral-900">{title}</h2>
            )}
            {description && (
              <p className="mt-3 text-sm sm:text-lg text-neutral-500 leading-relaxed">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

/** Bulleted list rendered as a two-column check list. */
export function CheckList({ items, columns = 2 }) {
  const cols = columns === 1 ? 'sm:grid-cols-1' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'
  return (
    <ul className={`grid grid-cols-1 ${cols} gap-3 sm:gap-4`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm sm:text-base text-neutral-600 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** Wraps a static content page: content + site footer. */
export function ContentPage({ title, children }) {
  usePageTitle(title)
  return (
    <div className="bg-white">
      {children}
      <SiteFooter />
    </div>
  )
}
