import { cva } from 'class-variance-authority'
import { cn } from './utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium truncate max-w-[200px]',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 text-neutral-700',
        success: 'bg-green-50 text-green-700',
        warning: 'bg-amber-50 text-amber-700',
        error: 'bg-red-50 text-red-700',
        info: 'bg-blue-50 text-blue-700',
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
