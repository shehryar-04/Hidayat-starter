import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { translate, SUPPORTED_LANGUAGES, RTL_LANGUAGES } from './intlCore'

const IntlContext = createContext({
  language: 'en',
  setLanguage: () => {},
  intl: (key, params, fallback) => translate(key, params, fallback, 'en'),
  t: (key, params, fallback) => translate(key, params, fallback, 'en'),
  isRtl: false,
  dir: 'ltr',
  supportedLanguages: SUPPORTED_LANGUAGES,
  formatNumber: (num) => String(num),
  formatDate: (date) => String(date),
})

const STORAGE_KEY = 'hidayat_language'

export function IntlProvider({ children, defaultLanguage = 'en' }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || defaultLanguage
    } catch {
      return defaultLanguage
    }
  })

  const isRtl = useMemo(() => RTL_LANGUAGES.has(language), [language])
  const dir = isRtl ? 'rtl' : 'ltr'

  // Apply direction and language attributes to the documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.setAttribute('dir', dir)
    root.setAttribute('lang', language)

    // Optional font family class helper for Nastaleeq/Arabic styling
    if (language === 'ur') {
      root.classList.add('font-urdu-mode')
    } else {
      root.classList.remove('font-urdu-mode')
    }
  }, [dir, language])

  const setLanguage = useCallback((newLang) => {
    const valid = SUPPORTED_LANGUAGES.some((l) => l.code === newLang)
    const target = valid ? newLang : 'en'
    setLanguageState(target)
    try {
      localStorage.setItem(STORAGE_KEY, target)
    } catch {}
  }, [])

  const intl = useCallback(
    (key, params, fallback) => {
      return translate(key, params, fallback, language)
    },
    [language]
  )

  const formatNumber = useCallback(
    (number, options) => {
      try {
        const locale = language === 'ur' ? 'ur-PK' : language === 'ar' ? 'ar-SA' : 'en-US'
        return new Intl.NumberFormat(locale, options).format(number)
      } catch {
        return String(number)
      }
    },
    [language]
  )

  const formatDate = useCallback(
    (date, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
      try {
        const d = date instanceof Date ? date : new Date(date)
        const locale = language === 'ur' ? 'ur-PK' : language === 'ar' ? 'ar-SA' : 'en-US'
        return new Intl.DateTimeFormat(locale, options).format(d)
      } catch {
        return String(date)
      }
    },
    [language]
  )

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      intl,
      t: intl, // alias t for convenience
      isRtl,
      dir,
      supportedLanguages: SUPPORTED_LANGUAGES,
      formatNumber,
      formatDate,
    }),
    [language, setLanguage, intl, isRtl, dir, formatNumber, formatDate]
  )

  return <IntlContext.Provider value={value}>{children}</IntlContext.Provider>
}

/**
 * useIntl hook to access translation and direction helpers.
 *
 * @example
 * const { intl, isRtl, setLanguage, language } = useIntl()
 * const saveText = intl('common.save')
 * const message = intl('students.studentCount', { count: 12 })
 */
export function useIntl() {
  const context = useContext(IntlContext)
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      intl: (key, params, fallback) => translate(key, params, fallback, 'en'),
      t: (key, params, fallback) => translate(key, params, fallback, 'en'),
      isRtl: false,
      dir: 'ltr',
      supportedLanguages: SUPPORTED_LANGUAGES,
      formatNumber: (num) => String(num),
      formatDate: (date) => String(date),
    }
  }
  return context
}

// Standalone global intl helper function
export const intl = (key, params, fallback) => translate(key, params, fallback, 'en')

export default IntlProvider
