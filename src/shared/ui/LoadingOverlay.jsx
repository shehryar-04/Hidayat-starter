import { Spinner } from './Spinner'
import { cn } from './utils'

/**
 * Standard LoadingOverlay Component
 *
 * @param {object} props
 * @param {boolean} [props.loading=true] - Whether to show the overlay
 * @param {string} [props.text='Loading...'] - Optional loading text
 * @param {boolean} [props.blur=true] - Apply backdrop blur
 * @param {string} [props.className] - Custom container classes
 * @param {React.ReactNode} [props.children] - Wrapped children content
 */
export function LoadingOverlay({
  loading = true,
  text,
  blur = true,
  className,
  children,
}) {
  if (!children) {
    if (!loading) return null
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 dark:bg-neutral-900/70',
          blur && 'backdrop-blur-xs',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Spinner size="lg" className="text-primary-500 mb-2" />
        {text && (
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {text}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div
          className={cn(
            'absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/70 dark:bg-neutral-900/70 rounded-inherit',
            blur && 'backdrop-blur-xs'
          )}
          role="status"
          aria-live="polite"
        >
          <Spinner size="md" className="text-primary-500 mb-2" />
          {text && (
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
              {text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default LoadingOverlay
