import { forwardRef } from 'react'
import { cn } from './utils'

/**
 * Responsive data table with semantic HTML, alternating rows, and hover highlight.
 * @param {object} props
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <Table><TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>John</TableCell></TableRow></TableBody></Table>
 */
export const Table = forwardRef(({ className, children, ...props }, ref) => (
  <div className="w-full overflow-x-auto custom-scrollbar rounded-xl border border-neutral-200/80 dark:border-[#1a2e23]">
    <table ref={ref} className={cn('w-full caption-bottom text-sm text-neutral-800 dark:text-neutral-200', className)} {...props}>
      {children}
    </table>
  </div>
))
Table.displayName = 'Table'

export const TableHeader = forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-neutral-50/80 dark:bg-[#14221b]/80 border-b border-neutral-200/80 dark:border-[#1a2e23]', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

export const TableBody = forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:nth-child(even)]:bg-neutral-50/40 dark:[&_tr:nth-child(even)]:bg-[#0c1410]/40', className)} {...props} />
))
TableBody.displayName = 'TableBody'

export const TableRow = forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('border-b border-neutral-100 dark:border-[#1a2e23]/60 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-[#14221b]/60', className)} {...props} />
))
TableRow.displayName = 'TableRow'

export const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} scope="col" className={cn('px-4 py-3.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider', className)} {...props} />
))
TableHead.displayName = 'TableHead'

export const TableCell = forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-4 py-3.5 text-sm text-neutral-800 dark:text-neutral-200', className)} {...props} />
))
TableCell.displayName = 'TableCell'
