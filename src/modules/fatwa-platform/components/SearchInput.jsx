import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Highlights matching text within a string by wrapping matched portions in <strong>.
 *
 * @param {string} text - The full text to render
 * @param {string} query - The search query to highlight
 * @returns {JSX.Element}
 */
function HighlightMatch({ text, query }) {
  if (!query || !query.trim()) {
    return <span>{text}</span>
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <strong key={i} className="font-semibold text-green-700">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

/**
 * SearchInput — Controlled search input with autocomplete dropdown.
 *
 * Features:
 * - Autocomplete dropdown showing up to 5 suggestions
 * - Highlight matching terms in suggestions
 * - Keyboard accessible (ArrowDown/ArrowUp, Enter, Escape)
 * - ARIA combobox pattern for screen readers
 * - Min 44px touch target on suggestion items
 *
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   suggestions: Array<{ title: string, slug: string, id: string }>,
 *   onSelect: (suggestion: { title: string, slug: string, id: string }) => void,
 *   placeholder?: string,
 *   isSearching?: boolean
 * }} props
 * @returns {JSX.Element}
 */
export default function SearchInput({
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder = 'Search fatwas...',
  isSearching = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const listboxRef = useRef(null)
  const containerRef = useRef(null)
  const suppressFocusRef = useRef(false)

  const showDropdown = isOpen && suggestions.length > 0

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  const handleInputChange = useCallback(
    (e) => {
      onChange(e.target.value)
      setIsOpen(true)
    },
    [onChange]
  )

  const handleFocus = useCallback(() => {
    if (suppressFocusRef.current) {
      suppressFocusRef.current = false
      return
    }
    setIsOpen(true)
  }, [])

  const handleSelect = useCallback(
    (suggestion) => {
      onSelect(suggestion)
      setIsOpen(false)
      setActiveIndex(-1)
    },
    [onSelect]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        suppressFocusRef.current = true
        inputRef.current?.focus()
        return
      }

      if (!showDropdown) {
        // Open dropdown on ArrowDown if there are suggestions
        if (e.key === 'ArrowDown' && suggestions.length > 0) {
          e.preventDefault()
          setIsOpen(true)
          setActiveIndex(0)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break

        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break

        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            handleSelect(suggestions[activeIndex])
          }
          break

        default:
          break
      }
    },
    [showDropdown, suggestions, activeIndex, handleSelect]
  )

  const listboxId = 'search-suggestions-listbox'
  const getOptionId = (index) => `search-option-${index}`

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? getOptionId(activeIndex) : undefined
          }
          aria-autocomplete="list"
          aria-label={placeholder}
          autoComplete="off"
        />

        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
          </div>
        )}
      </div>

      {showDropdown && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={getOptionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              className={`min-h-[44px] flex items-center p-2 px-3 cursor-pointer transition-colors duration-100 ${
                index === activeIndex
                  ? 'bg-green-50 text-green-900'
                  : 'hover:bg-gray-100 text-gray-800'
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(suggestion)
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <HighlightMatch text={suggestion.title} query={value} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
