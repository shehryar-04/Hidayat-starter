import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { detectDirection } from '../utils/rtlDetection'

/**
 * EnterpriseSearchBar — Full-featured search input with server-side autocomplete.
 *
 * Features:
 * - Real-time suggestions from PostgreSQL trigram matching
 * - Keyboard navigation (ArrowUp/Down, Enter, Escape)
 * - ARIA combobox pattern for accessibility
 * - RTL detection for Urdu/Arabic queries
 * - Loading indicator during suggestion fetch
 * - Clear button
 * - Min 44px touch targets
 */
export default function EnterpriseSearchBar({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  onSuggestionSelect,
  isSuggesting = false,
  placeholder = 'Search 70,000+ fatwas...',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const showDropdown = isOpen && suggestions.length > 0
  const isRtl = detectDirection(value) === 'rtl'

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  const handleChange = useCallback((e) => {
    onChange(e.target.value)
    setIsOpen(true)
  }, [onChange])

  const handleClear = useCallback(() => {
    onChange('')
    setIsOpen(false)
    inputRef.current?.focus()
  }, [onChange])

  const handleSelect = useCallback((suggestion) => {
    onSuggestionSelect(suggestion)
    setIsOpen(false)
    setActiveIndex(-1)
  }, [onSuggestionSelect])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    setIsOpen(false)
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      handleSelect(suggestions[activeIndex])
    } else if (onSubmit) {
      onSubmit(value)
    }
  }, [value, onSubmit, activeIndex, suggestions, handleSelect])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (!showDropdown) {
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
        setActiveIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0) {
          handleSelect(suggestions[activeIndex])
        } else if (onSubmit) {
          onSubmit(value)
          setIsOpen(false)
        }
        break
    }
  }, [showDropdown, suggestions, activeIndex, handleSelect, onSubmit, value])

  const listboxId = 'enterprise-search-listbox'

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        {/* Search icon */}
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          dir={isRtl ? 'rtl' : 'ltr'}
          className={`w-full h-14 rounded-xl border border-gray-200 bg-white shadow-sm
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            text-gray-900 placeholder-gray-400 text-base transition-shadow
            ${isRtl ? 'pr-12 pl-12 text-right font-urdu' : 'pl-12 pr-12'}`}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `search-opt-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label="Search fatwas"
          autoComplete="off"
        />

        {/* Right side: loading or clear */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSuggesting && (
            <Loader2 className="w-5 h-5 text-green-600 animate-spin" aria-hidden="true" />
          )}
          {value && !isSuggesting && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map((suggestion, index) => {
            const suggRtl = detectDirection(suggestion.term || suggestion.title || '') === 'rtl'
            return (
              <li
                key={suggestion.term || suggestion.id || index}
                id={`search-opt-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`min-h-[48px] flex items-center px-4 py-3 cursor-pointer transition-colors
                  ${index === activeIndex ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-800'}
                  ${suggRtl ? 'text-right font-urdu flex-row-reverse' : ''}`}
                dir={suggRtl ? 'rtl' : undefined}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion) }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0 mr-3" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{suggestion.term || suggestion.title}</span>
                  {suggestion.source && (
                    <span className="text-xs text-gray-500 capitalize">{suggestion.source}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
