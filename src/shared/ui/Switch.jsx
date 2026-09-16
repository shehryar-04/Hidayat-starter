import { forwardRef, useId } from 'react'
import { cn } from './utils'

/**
 * Accessible Toggle Switch Component
 *
 * @param {object} props
 * @param {boolean} props.checked - Controlled state
 * @param {function} props.onChange - Toggle event
 * @param {string} [props.label] - Switch label
 * @param {string} [props.description] - Supporting description
 * @param {boolean} [props.disabled=false] - Disabled state
 */
export const Switch = forwardRef(
  ({ checked = false, onChange, label, description, disabled = false, id: customId, className, ...props }, ref) => {
    const generatedId = useId()
    const id = customId || generatedId

    const handleToggle = (e) => {
      if (disabled) return
      onChange?.(!checked, e)
    }

    return (
      <div className={cn('flex items-center justify-between gap-3 select-none', className)}>
        {(label || description) && (
          <div className="flex flex-col text-xs sm:text-sm">
            {label && (
              <label
                htmlFor={id}
                className={cn('font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer', disabled && 'opacity-60 cursor-not-allowed')}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}

        <button
          ref={ref}
          type="button"
          role="switch"
          id={id}
          aria-checked={checked}
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            checked ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-700',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>
    )
  }
)

Switch.displayName = 'Switch'
export default Switch
