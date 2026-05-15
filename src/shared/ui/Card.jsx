import { forwardRef } from 'react'
import { cn } from './utils'

/**
 * Card container with optional interactive hover effects and status variant.
 * @param {object} props
 * @param {boolean} [props.interactive] - Enables hover elevation and focus ring
 * @param {string} [props.variant] - Left border color for status indication
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <Card interactive><CardHeader>Title</CardHeader><CardContent>Body</CardContent></Card>
 */
export const Card = forwardRef(({ interactive, variant, className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white border border-neutral-200 rounded-xl shadow-sm',
      interactive && 'cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
      variant && `border-l-4 border-l-${variant}`,
      className
    )}
    tabIndex={interactive ? 0 : undefined}
    {...props}
  >
    {children}
  </div>
))
Card.displayName = 'Card'

export const CardHeader = forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 pt-6 pb-2', className)} {...props}>{children}</div>
))
CardHeader.displayName = 'CardHeader'

export const CardContent = forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 py-4', className)} {...props}>{children}</div>
))
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 pb-6 pt-2 border-t border-neutral-100', className)} {...props}>{children}</div>
))
CardFooter.displayName = 'CardFooter'
