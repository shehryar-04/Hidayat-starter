import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from './Button'
import { cn } from './utils'

/**
 * Reusable Pagination Bar
 * Theme-aware in both Light and Dark modes.
 *
 * @param {object} props
 * @param {number} props.currentPage - Current active page (1-based)
 * @param {number} props.totalPages - Total pages count
 * @param {function} props.onPageChange - Triggered on page change
 * @param {number} [props.totalItems] - Optional total item count
 * @param {number} [props.pageSize] - Page size
 * @param {string} [props.className] - Container CSS class
 */
export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize,
  className,
}) {
  if (totalPages <= 1 && !totalItems) return null

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis-start')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('ellipsis-end')
      pages.push(totalPages)
    }

    return pages
  }

  const startItem = (currentPage - 1) * (pageSize || 10) + 1
  const endItem = Math.min(currentPage * (pageSize || 10), totalItems || 0)

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-3 select-none', className)}>
      {/* Items count summary */}
      {totalItems !== undefined && (
        <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Showing <span className="font-semibold text-neutral-800 dark:text-neutral-200">{startItem}</span> to{' '}
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{endItem}</span> of{' '}
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{totalItems}</span> results
        </div>
      )}

      {/* Pagination buttons */}
      <div className="flex items-center gap-1.5 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="p-2 h-9 w-9 rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {getPageNumbers().map((p, idx) => {
          if (p === 'ellipsis-start' || p === 'ellipsis-end') {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-neutral-400 dark:text-neutral-500">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            )
          }

          const isActive = p === currentPage

          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              className={cn(
                'h-9 min-w-[36px] px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer',
                isActive
                  ? 'bg-primary-500 dark:bg-primary-600 text-white shadow-xs'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#14221b] border border-transparent hover:border-neutral-200 dark:hover:border-[#1a2e23]'
              )}
            >
              {p}
            </button>
          )
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="p-2 h-9 w-9 rounded-xl"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default Pagination
