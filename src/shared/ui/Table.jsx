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
  <div className="w-full overflow-x-auto">
    <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props}>
      {children}
    </table>
  </div>
))
Table.displayName = 'Table'

export const TableHeader = forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-neutral-50', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

export const TableBody = forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:nth-child(even)]:bg-neutral-50/50', className)} {...props} />
))
TableBody.displayName = 'TableBody'

export const TableRow = forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('border-b border-neutral-100 transition-colors duration-150 hover:bg-neutral-100', className)} {...props} />
))
TableRow.displayName = 'TableRow'

export const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} scope="col" className={cn('px-4 py-3 text-left text-sm font-semibold text-neutral-700', className)} {...props} />
))
TableHead.displayName = 'TableHead'

export const TableCell = forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-4 py-3 text-sm', className)} {...props} />
))
TableCell.displayName = 'TableCell'
