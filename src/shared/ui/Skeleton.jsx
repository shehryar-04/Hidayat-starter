import { cn } from './utils'

/**
 * Skeleton placeholder with shimmer animation for loading states.
 * @param {object} props
 * @param {string} [props.className] - Size and shape classes (e.g., 'h-4 w-full rounded')
 * @example
 * <Skeleton className="h-4 w-3/4" />
 * <Skeleton className="h-10 w-10 rounded-full" />
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-shimmer rounded-lg', className)}
      aria-hidden="true"
      {...props}
    />
  )
}
