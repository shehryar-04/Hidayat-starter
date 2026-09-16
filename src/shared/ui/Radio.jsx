import { forwardRef, useId, createContext, useContext } from 'react'
import { cn } from './utils'

const RadioGroupContext = createContext({
  name: '',
  value: undefined,
  onChange: () => {},
  disabled: false,
})

export function RadioGroup({ name, value, onChange, disabled = false, className, children, ...props }) {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange, disabled }}>
      <div role="radiogroup" className={cn('space-y-2.5', className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export const Radio = forwardRef(
  ({ value, label, description, disabled: itemDisabled, id: customId, className, ...props }, ref) => {
    const generatedId = useId()
    const id = customId || generatedId
    const group = useContext(RadioGroupContext)

    const isChecked = group.value !== undefined ? group.value === value : props.checked
    const isDisabled = itemDisabled || group.disabled

    const handleChange = (e) => {
      if (group.onChange) group.onChange(value, e)
      if (props.onChange) props.onChange(e)
    }

    return (
      <div className={cn('flex items-start gap-2.5 select-none', className)}>
        <div className="relative flex items-center h-5">
          <input
            ref={ref}
            type="radio"
            id={id}
            name={group.name || props.name}
            value={value}
            checked={isChecked}
            disabled={isDisabled}
            onChange={handleChange}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded-full border transition-all duration-150 flex items-center justify-center cursor-pointer',
              'border-neutral-300 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14]',
              'peer-checked:border-primary-500',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
              isDisabled && 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-[#14221b]'
            )}
          >
            {isChecked && (
              <span className="w-2 h-2 rounded-full bg-primary-500" />
            )}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col text-xs sm:text-sm">
            {label && (
              <label
                htmlFor={id}
                className={cn(
                  'font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer',
                  isDisabled && 'cursor-not-allowed opacity-60'
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
          </div>
        )}
      </div>
    )
  }
)

Radio.displayName = 'Radio'
export default Radio
