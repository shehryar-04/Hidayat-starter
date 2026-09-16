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
      'h-10 w-full rounded-xl border px-3.5 text-sm transition-all duration-150 outline-none',
      'bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
      'border-neutral-200/90 dark:border-[#1a2e23] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:border-emerald-500/80',
      error && 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500',
      'disabled:opacity-50 disabled:pointer-events-none',
      className
    )}
    aria-invalid={error ? true : undefined}
    {...props}
  />
))
Input.displayName = 'Input'
