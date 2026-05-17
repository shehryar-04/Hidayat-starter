/**
 * RTL Detection Utility
 *
 * Detects whether a text segment contains Arabic or Urdu characters
 * and returns the appropriate text direction.
 *
 * Unicode ranges covered:
 * - U+0600–U+06FF: Arabic
 * - U+0750–U+077F: Arabic Supplement
 * - U+FB50–U+FDFF: Arabic Presentation Forms-A
 * - U+FE70–U+FEFF: Arabic Presentation Forms-B
 */

const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/

/**
 * Detects the text direction for a given text segment.
 *
 * @param {string} text - The text to analyze
 * @returns {"rtl" | "ltr"} - "rtl" if text contains Arabic/Urdu characters, "ltr" otherwise
 */
export function detectDirection(text) {
  if (!text) {
    return 'ltr'
  }

  return RTL_REGEX.test(text) ? 'rtl' : 'ltr'
}
