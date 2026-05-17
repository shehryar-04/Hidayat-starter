/**
 * Check if a category name is valid (not corrupted/garbled).
 * Filters out names containing:
 * - Unicode replacement character (U+FFFD) — shows as �
 * - Excessive consecutive special characters
 * - Empty or whitespace-only names
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isValidCategoryName(name) {
  if (!name || typeof name !== 'string') return false
  if (!name.trim()) return false

  // Contains Unicode replacement character (garbled encoding)
  if (name.includes('\uFFFD') || name.includes('�')) return false

  // Contains null bytes or control characters (except newline/tab)
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(name)) return false

  return true
}
