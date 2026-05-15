import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names using clsx for conditional logic and tailwind-merge
 * to resolve conflicting Tailwind CSS utility classes.
 * @param {...(string|object|array)} inputs - Class values to merge
 * @returns {string} Merged class string with conflicts resolved
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary-500', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
