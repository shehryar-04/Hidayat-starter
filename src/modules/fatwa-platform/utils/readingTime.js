/**
 * Calculate estimated reading time for a given text.
 * Uses a rate of 200 words per minute.
 *
 * @param {string} text - The text content to calculate reading time for
 * @returns {number} Estimated reading time in minutes (minimum 1)
 */
export function calculateReadingTime(text) {
  if (!text || typeof text !== 'string') {
    return 1
  }

  const words = text.trim().split(/\s+/).filter(token => token.length > 0)
  const wordCount = words.length

  if (wordCount === 0) {
    return 1
  }

  return Math.max(1, Math.ceil(wordCount / 200))
}
