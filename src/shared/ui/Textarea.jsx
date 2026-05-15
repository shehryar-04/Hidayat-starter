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
        'w-full min-h-[80px] max-h-[320px] rounded-lg border px-3 py-2 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 outline-none resize-none',
        'border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
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
