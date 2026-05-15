import { forwardRef } from 'react'
import { cn } from './utils'

/**
 * Form label component with consistent typography.
 * @param {object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Label text
 * @example
 * <Label htmlFor="email">Email address</Label>
 */
export const Label = forwardRef(({ className, children, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium text-neutral-700', className)}
    {...props}
  >
    {children}
  </label>
))
Label.displayName = 'Label'
