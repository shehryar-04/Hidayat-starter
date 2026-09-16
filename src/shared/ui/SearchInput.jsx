import { forwardRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from './utils'

/**
 * Standard SearchInput with search icon, clear button, and loading spinner.
 * Completely theme-aware in both Light and Dark modes.
 *
 * @param {object} props
 * @param {string} [props.value] - Current search query
 * @param {function} props.onChange - Input change event handler
 * @param {function} [props.onClear] - Triggered when clear button (X) is clicked
 * @param {boolean} [props.loading=false] - Whether search is actively fetching
 * @param {string} [props.placeholder='Search...'] - Placeholder text
 * @param {string} [props.shortcut] - Keyboard shortcut label (e.g. '⌘K' or '/')
 * @param {string} [props.className] - Input CSS class
 */
export const SearchInput = forwardRef(
  (
    {
      value,
      onChange,
      onClear,
      loading = false,
      placeholder = 'Search...',
      shortcut,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const handleClear = () => {
      if (onClear) {
        onClear()
      } else if (onChange) {
        onChange({ target: { value: '' } })
      }
    }

    return (
      <div className={cn('relative flex items-center w-full', containerClassName)}>
        <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />

        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full h-10 pl-10 pr-10 text-sm rounded-xl border transition-all duration-150 outline-none shadow-xs',
            'bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            'border-neutral-200/90 dark:border-[#1a2e23] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:border-emerald-500/80',
            'disabled:opacity-50 disabled:pointer-events-none',
            className
          )}
          {...props}
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {loading ? (
            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : shortcut ? (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-[#14221b] rounded border border-neutral-200 dark:border-[#1a2e23]">
              {shortcut}
            </kbd>
          ) : null}
        </div>
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
export default SearchInput
