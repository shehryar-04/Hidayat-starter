import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { detectDirection } from './rtlDetection.js'

/**
 * Feature: fatwa-knowledge-platform, Property 15: RTL Detection
 *
 * Validates: Requirements 13.2
 *
 * Property: For any text segment containing Arabic or Urdu Unicode characters
 * (U+0600–U+06FF, U+0750–U+077F, U+FB50–U+FDFF, U+FE70–U+FEFF), the
 * Reading_Experience SHALL apply dir="rtl". Segments containing only Latin
 * characters SHALL have dir="ltr".
 */

/**
 * Helper to check if a character falls within Arabic/Urdu Unicode ranges.
 */
function isArabicUrdu(char) {
  const code = char.charCodeAt(0)
  return (
    (code >= 0x0600 && code <= 0x06ff) ||
    (code >= 0x0750 && code <= 0x077f) ||
    (code >= 0xfb50 && code <= 0xfdff) ||
    (code >= 0xfe70 && code <= 0xfeff)
  )
}

describe('Feature: fatwa-knowledge-platform, Property 15: RTL Detection', () => {
  it('RTL detection: strings containing Arabic/Urdu characters return "rtl"', () => {
    // Generator: produce a string that contains at least one Arabic/Urdu character
    const arabicCharArb = fc
      .integer({ min: 0x0600, max: 0x06ff })
      .map((c) => String.fromCharCode(c))

    const stringWithArabicArb = fc
      .tuple(fc.string(), arabicCharArb, fc.string())
      .map(([prefix, arabicChar, suffix]) => prefix + arabicChar + suffix)

    fc.assert(
      fc.property(stringWithArabicArb, (text) => {
        expect(detectDirection(text)).toBe('rtl')
      }),
      { numRuns: 100 }
    )
  })

  it('RTL detection: strings with Arabic Supplement range (U+0750–U+077F) return "rtl"', () => {
    const arabicSupplementCharArb = fc
      .integer({ min: 0x0750, max: 0x077f })
      .map((c) => String.fromCharCode(c))

    const stringWithSupplementArb = fc
      .tuple(fc.string(), arabicSupplementCharArb, fc.string())
      .map(([prefix, char, suffix]) => prefix + char + suffix)

    fc.assert(
      fc.property(stringWithSupplementArb, (text) => {
        expect(detectDirection(text)).toBe('rtl')
      }),
      { numRuns: 100 }
    )
  })

  it('RTL detection: strings with Arabic Presentation Forms (U+FB50–U+FDFF, U+FE70–U+FEFF) return "rtl"', () => {
    const presentationFormsCharArb = fc.oneof(
      fc.integer({ min: 0xfb50, max: 0xfdff }).map((c) => String.fromCharCode(c)),
      fc.integer({ min: 0xfe70, max: 0xfeff }).map((c) => String.fromCharCode(c))
    )

    const stringWithPresentationArb = fc
      .tuple(fc.string(), presentationFormsCharArb, fc.string())
      .map(([prefix, char, suffix]) => prefix + char + suffix)

    fc.assert(
      fc.property(stringWithPresentationArb, (text) => {
        expect(detectDirection(text)).toBe('rtl')
      }),
      { numRuns: 100 }
    )
  })

  it('LTR detection: strings containing only ASCII characters return "ltr"', () => {
    // Generator: produce non-empty strings from ASCII printable range (0x20-0x7E)
    const asciiCharArb = fc
      .integer({ min: 0x0020, max: 0x007e })
      .map((c) => String.fromCharCode(c))

    const asciiStringArb = fc
      .array(asciiCharArb, { minLength: 1, maxLength: 50 })
      .map((chars) => chars.join(''))

    fc.assert(
      fc.property(asciiStringArb, (text) => {
        expect(detectDirection(text)).toBe('ltr')
      }),
      { numRuns: 100 }
    )
  })

  it('LTR detection: strings with only Latin characters (no Arabic/Urdu) return "ltr"', () => {
    // Generator: produce strings from printable Latin chars filtered to exclude Arabic/Urdu
    const latinCharArb = fc
      .integer({ min: 0x0020, max: 0x007e })
      .map((c) => String.fromCharCode(c))

    const latinStringArb = fc
      .array(latinCharArb, { minLength: 1, maxLength: 50 })
      .map((chars) => chars.join(''))

    fc.assert(
      fc.property(latinStringArb, (text) => {
        // Verify none of the characters are in Arabic/Urdu ranges
        const hasArabic = [...text].some(isArabicUrdu)
        expect(hasArabic).toBe(false)
        expect(detectDirection(text)).toBe('ltr')
      }),
      { numRuns: 100 }
    )
  })
})
