import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from './utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.97] active:duration-100',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md shadow-sm',
        secondary: 'bg-neutral-600 text-white hover:bg-neutral-700 hover:shadow-md',
        outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-50 hover:shadow-sm',
        ghost: 'bg-transparent hover:bg-neutral-100',
        destructive: 'bg-error text-white hover:bg-red-700 hover:shadow-md shadow-sm',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm rounded',
        md: 'px-5 py-2.5 text-base rounded-md',
        lg: 'px-7 py-3.5 text-lg rounded-lg',
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
