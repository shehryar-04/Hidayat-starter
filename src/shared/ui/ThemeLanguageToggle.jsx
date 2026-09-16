import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Languages, Check } from 'lucide-react'
import { useTheme } from '../../theme/ThemeProvider'
import { useIntl } from '../../lib/intl/IntlProvider'
import { cn } from './utils'

/**
 * Combined or individual Theme & Language Switcher Controls
 */
export function ThemeLanguageToggle({ className, showLanguage = true, showTheme = true }) {
  const { isDark, toggleMode } = useTheme()
  const { language, setLanguage, supportedLanguages } = useIntl()
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangMenuOpen(false)
      }
    }
    if (langMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [langMenuOpen])

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {/* Language Switcher */}
      {showLanguage && (
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen((o) => !o)}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 text-xs font-medium"
            aria-label="Change language"
            title="Change language"
          >
            <Languages className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span className="uppercase text-[11px] font-bold tracking-wider hidden sm:inline">
              {language}
            </span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {supportedLanguages.map((lang) => {
                const isSelected = lang.code === language
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code)
                      setLangMenuOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors',
                      isSelected
                        ? 'font-bold text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/30'
                        : 'text-neutral-700 dark:text-neutral-200'
                    )}
                  >
                    <span>{lang.nativeName} ({lang.name})</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-500" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Theme Switcher */}
      {showTheme && (
        <button
          type="button"
          onClick={toggleMode}
          className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-neutral-500" />
          )}
        </button>
      )}
    </div>
  )
}

export default ThemeLanguageToggle
