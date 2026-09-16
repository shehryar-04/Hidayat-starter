import { useId } from 'react'
import { Label } from './Label'
import { cn } from './utils'

/**
 * Standard FormField component that binds Label, Input, Error Message, and Helper Text.
 *
 * @param {object} props
 * @param {string} [props.label] - Field label text
 * @param {string} [props.id] - HTML id for the input
 * @param {boolean} [props.required=false] - Shows required asterisk
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.helperText] - Supplementary instructions
 * @param {string} [props.className] - Container CSS class
 * @param {React.ReactNode} props.children - Form control element (Input, Textarea, Select)
 */
export function FormField({
  label,
  id: customId,
  required = false,
  error,
  helperText,
  className,
  children,
  ...props
}) {
  const generatedId = useId()
  const id = customId || generatedId
  const errorId = `${id}-error`
  const helperId = `${id}-helper`

  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </Label>
        </div>
      )}

      <div>{children}</div>

      {error ? (
        <p id={errorId} className="text-xs font-medium text-red-600 dark:text-red-400 mt-1" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

export default FormField
