import { forwardRef, useCallback } from 'react'
import { cn } from './utils'

/**
 * Auto-resizing textarea with consistent styling matching Input.
 * @param {object} props
 * @param {boolean} [props.error] - Shows error styling
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <Textarea placeholder="Write your message..." />
 */
export const Textarea = forwardRef(({ className, error, onInput, ...props }, ref) => {
  const handleInput = useCallback((e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 320) + 'px'
    onInput?.(e)
  }, [onInput])

  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[88px] max-h-[320px] rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-150 outline-none resize-none',
        'bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
        'border-neutral-200/90 dark:border-[#1a2e23] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:border-emerald-500/80',
        error && 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500',
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      aria-invalid={error ? true : undefined}
      onInput={handleInput}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export default Textarea
