import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './Button'
import { cn } from './utils'

/**
 * Standard ErrorState Component
 *
 * @param {object} props
 * @param {React.ComponentType} [props.icon] - Icon component (default AlertTriangle)
 * @param {string} [props.title='Something went wrong'] - Error heading
 * @param {string} [props.message] - Explanatory error message
 * @param {function} [props.onRetry] - Callback when user clicks retry button
 * @param {string} [props.retryText='Try Again'] - Label for retry button
 * @param {Error|string} [props.error] - Optional technical error object/string for developer details
 * @param {React.ReactNode} [props.action] - Custom action button(s)
 * @param {string} [props.className] - Container CSS classes
 */
export function ErrorState({
  icon: Icon = AlertTriangle,
  title = 'Unable to load data',
  message = 'An unexpected error occurred while processing your request. Please try again.',
  onRetry,
  retryText = 'Try Again',
  error,
  action,
  className,
}) {
  const [showDetails, setShowDetails] = useState(false)
  const technicalMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : null

  return (
    <motion.div
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center max-w-md mx-auto', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      role="alert"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 shadow-xs">
        <Icon className="w-6 h-6" strokeWidth={2} />
      </div>

      <h3 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
        {message}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{retryText}</span>
          </Button>
        )}
        {action}
      </div>

      {/* Optional Technical details toggle for debugging */}
      {technicalMessage && process.env.NODE_ENV === 'development' && (
        <div className="mt-6 w-full text-left">
          <button
            type="button"
            onClick={() => setShowDetails((d) => !d)}
            className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors mx-auto"
          >
            <span>{showDetails ? 'Hide error details' : 'Show error details'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showDetails && (
            <pre className="mt-2 p-3 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-red-600 dark:text-red-400 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {technicalMessage}
            </pre>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default ErrorState
