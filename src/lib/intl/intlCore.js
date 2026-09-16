import { en } from './translations/en'
import { ur } from './translations/ur'
import { ar } from './translations/ar'

export const translations = {
  en,
  ur,
  ar,
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
]

export const RTL_LANGUAGES = new Set(['ur', 'ar'])

/**
 * Resolves a nested key string like 'common.save' from a dictionary object.
 */
function getNestedValue(obj, keyPath) {
  if (!obj || !keyPath) return undefined
  const keys = keyPath.split('.')
  let current = obj
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k]
    } else {
      return undefined
    }
  }
  return current
}

/**
 * Humanizes a dot-separated key (e.g., 'students.addStudent' -> 'Add Student')
 */
function humanizeKey(key) {
  if (!key) return ''
  const lastPart = key.split('.').pop() || key
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

/**
 * Formats translation string by replacing `{param}` tokens with provided values.
 */
export function interpolate(template, params) {
  if (typeof template !== 'string' || !params) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in params && params[key] !== undefined && params[key] !== null
      ? String(params[key])
      : match
  })
}

/**
 * Global translation resolver function
 *
 * @param {string} key - Dot-separated translation key (e.g. 'common.save')
 * @param {object} [params] - Interpolation arguments (e.g. { count: 5 })
 * @param {string} [fallback] - Optional custom fallback text
 * @param {string} [lang='en'] - Target language code
 * @returns {string} Translated and interpolated text
 */
export function translate(key, params = null, fallback = '', lang = 'en') {
  if (!key) return ''

  // Try target language
  const dict = translations[lang] || translations.en
  let value = getNestedValue(dict, key)

  // Fallback to English if not found
  if (value === undefined && lang !== 'en') {
    value = getNestedValue(translations.en, key)
  }

  // If still not found, return custom fallback or humanized key
  if (value === undefined) {
    if (process.env.NODE_ENV === 'development' && !fallback) {
      // Helpful dev warning
      console.warn(`[INTL] Missing translation key: "${key}" for language "${lang}"`)
    }
    return fallback || humanizeKey(key)
  }

  return interpolate(value, params)
}
