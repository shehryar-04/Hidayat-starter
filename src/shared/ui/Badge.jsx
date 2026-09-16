import { cva } from 'class-variance-authority'
import { cn } from './utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide truncate max-w-[200px] border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 dark:bg-[#1a2e23] text-neutral-700 dark:text-neutral-200 border-neutral-200/80 dark:border-[#223d2e]',
        success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
        warning: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
        error: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-800/40',
        info: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40',
        primary: 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-emerald-300 border-primary-200/60 dark:border-primary-800/40',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

/**
 * Status badge with semantic color variants and optional dot indicator.
 * @param {object} props
 * @param {'default'|'success'|'warning'|'error'|'info'} [props.variant='default'] - Color variant
 * @param {boolean} [props.dot] - Show dot indicator before text
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <Badge variant="success" dot>Active</Badge>
 */
export function Badge({ variant, dot, className, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn('w-2 h-2 rounded-full mr-1.5', {
          'bg-neutral-500': variant === 'default' || !variant,
          'bg-green-500': variant === 'success',
          'bg-amber-500': variant === 'warning',
          'bg-red-500': variant === 'error',
          'bg-blue-500': variant === 'info',
        })} />
      )}
      {children}
    </span>
  )
}
export { badgeVariants }
