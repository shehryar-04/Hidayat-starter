import { forwardRef, useId } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from './utils'

/**
 * Accessible Checkbox Component
 * Theme-aware in both Light and Dark modes.
 *
 * @param {object} props
 * @param {boolean} [props.checked] - Controlled checked state
 * @param {boolean} [props.indeterminate] - Intermediate state
 * @param {string} [props.label] - Checkbox label text
 * @param {string} [props.description] - Supporting description
 * @param {string} [props.error] - Error message
 * @param {boolean} [props.disabled=false] - Disabled state
 */
export const Checkbox = forwardRef(
  (
    {
      checked,
      indeterminate,
      label,
      description,
      error,
      disabled = false,
      id: customId,
      className,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = customId || generatedId

    return (
      <div className={cn('flex items-start gap-2.5 select-none', className)}>
        <div className="relative flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="sr-only peer"
            aria-invalid={error ? 'true' : undefined}
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center cursor-pointer',
              'border-neutral-300 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14]',
              'peer-checked:bg-primary-500 peer-checked:border-primary-500 text-white',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
              disabled && 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-[#14221b]',
              error && 'border-red-500 peer-focus-visible:ring-red-500'
            )}
          >
            {checked ? (
              <Check className="w-3 h-3 stroke-[3]" />
            ) : indeterminate ? (
              <Minus className="w-3 h-3 stroke-[3]" />
            ) : null}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col text-xs sm:text-sm">
            {label && (
              <label
                htmlFor={id}
                className={cn(
                  'font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {description}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
export default Checkbox
