import { describe, it, expect } from 'vitest'
import { detectDirection } from './rtlDetection'

describe('detectDirection', () => {
  describe('returns "rtl" for Arabic/Urdu text', () => {
    it('detects Arabic text', () => {
      expect(detectDirection('بسم الله الرحمن الرحيم')).toBe('rtl')
    })

    it('detects Urdu text', () => {
      expect(detectDirection('اسلام علیکم')).toBe('rtl')
    })

    it('detects mixed Arabic and Latin text', () => {
      expect(detectDirection('The word سلام means peace')).toBe('rtl')
    })

    it('detects Arabic Supplement range (U+0750–U+077F)', () => {
      expect(detectDirection('\u0750')).toBe('rtl')
      expect(detectDirection('\u077F')).toBe('rtl')
    })

    it('detects Arabic Presentation Forms-A (U+FB50–U+FDFF)', () => {
      expect(detectDirection('\uFB50')).toBe('rtl')
      expect(detectDirection('\uFDFF')).toBe('rtl')
    })

    it('detects Arabic Presentation Forms-B (U+FE70–U+FEFF)', () => {
      expect(detectDirection('\uFE70')).toBe('rtl')
      expect(detectDirection('\uFEFF')).toBe('rtl')
    })

    it('detects single Arabic character in long Latin text', () => {
      expect(detectDirection('This is a long English sentence with one Arabic char ع in it')).toBe('rtl')
    })
  })

  describe('returns "ltr" for Latin-only text', () => {
    it('detects English text', () => {
      expect(detectDirection('Hello World')).toBe('ltr')
    })

    it('detects text with numbers and punctuation', () => {
      expect(detectDirection('Fatwa #123 - Published on 2024-01-15')).toBe('ltr')
    })

    it('detects text with special characters', () => {
      expect(detectDirection('test@email.com & more!')).toBe('ltr')
    })
  })

  describe('edge cases', () => {
    it('returns "ltr" for empty string', () => {
      expect(detectDirection('')).toBe('ltr')
    })

    it('returns "ltr" for null', () => {
      expect(detectDirection(null)).toBe('ltr')
    })

    it('returns "ltr" for undefined', () => {
      expect(detectDirection(undefined)).toBe('ltr')
    })

    it('returns "ltr" for whitespace-only string', () => {
      expect(detectDirection('   ')).toBe('ltr')
    })
  })
})
