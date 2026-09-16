import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from './utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.01] active:scale-[0.98] active:duration-100 cursor-pointer select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 dark:bg-primary-600 text-white hover:bg-primary-600 dark:hover:bg-primary-500 shadow-xs hover:shadow-primary-500/20',
        secondary: 'bg-neutral-800 dark:bg-neutral-800 text-white hover:bg-neutral-900 dark:hover:bg-neutral-700 shadow-xs',
        outline: 'border border-neutral-300 dark:border-[#1a2e23] bg-transparent text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#14221b] hover:text-neutral-900 dark:hover:text-white',
        ghost: 'bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-[#14221b] hover:text-neutral-900 dark:hover:text-white',
        destructive: 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600 shadow-xs hover:shadow-red-600/20',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
        md: 'px-4 py-2 text-sm font-medium rounded-xl gap-2',
        lg: 'px-6 py-2.5 text-base font-medium rounded-xl gap-2.5',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

/**
 * A versatile button component with multiple variants, sizes, and states.
 * Supports loading state with spinner, focus ring, hover/active scale transitions,
 * and proper ARIA attributes for accessibility.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'destructive'} [props.variant='primary'] - Visual style variant
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Size variant
 * @param {boolean} [props.loading=false] - Shows spinner and disables interaction
 * @param {boolean} [props.disabled=false] - Disables the button
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 *
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="destructive" loading>Deleting...</Button>
 * <Button variant="outline" size="sm" disabled>Disabled</Button>
 */
export const Button = forwardRef(({ variant, size, loading, className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || props.disabled || undefined}
      {...props}
    >
      {loading ? (
        <Loader2
          className="animate-spin"
          size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
        />
      ) : (
        children
      )}
    </button>
  )
})

Button.displayName = 'Button'
export { buttonVariants }
