import { forwardRef } from 'react'
import { cn } from './utils'

/**
 * Text input component with focus ring, error state, and consistent styling.
 * @param {object} props
 * @param {boolean} [props.error] - Shows error styling (red border, red focus ring)
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <Input placeholder="Enter name" />
 * <Input error aria-describedby="name-error" />
 */
export const Input = forwardRef(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-lg border px-3 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 outline-none',
      'border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
      error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
      'disabled:opacity-50 disabled:pointer-events-none',
      className
    )}
    aria-invalid={error ? true : undefined}
    {...props}
  />
))
Input.displayName = 'Input'
