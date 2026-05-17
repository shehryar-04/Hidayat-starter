import { describe, it, expect } from 'vitest'
import { calculateReadingTime } from './readingTime'

describe('calculateReadingTime', () => {
  it('returns 1 for empty string', () => {
    expect(calculateReadingTime('')).toBe(1)
  })

  it('returns 1 for null input', () => {
    expect(calculateReadingTime(null)).toBe(1)
  })

  it('returns 1 for undefined input', () => {
    expect(calculateReadingTime(undefined)).toBe(1)
  })

  it('returns 1 for whitespace-only string', () => {
    expect(calculateReadingTime('   ')).toBe(1)
  })

  it('returns 1 for text with fewer than 200 words', () => {
    const text = 'word '.repeat(100).trim()
    expect(calculateReadingTime(text)).toBe(1)
  })

  it('returns 1 for exactly 200 words', () => {
    const text = 'word '.repeat(200).trim()
    expect(calculateReadingTime(text)).toBe(1)
  })

  it('returns 2 for 201 words', () => {
    const text = 'word '.repeat(201).trim()
    expect(calculateReadingTime(text)).toBe(2)
  })

  it('returns 2 for 400 words', () => {
    const text = 'word '.repeat(400).trim()
    expect(calculateReadingTime(text)).toBe(2)
  })

  it('returns 3 for 401 words', () => {
    const text = 'word '.repeat(401).trim()
    expect(calculateReadingTime(text)).toBe(3)
  })

  it('returns 5 for 1000 words', () => {
    const text = 'word '.repeat(1000).trim()
    expect(calculateReadingTime(text)).toBe(5)
  })

  it('handles text with multiple spaces between words', () => {
    const text = 'one   two   three'
    expect(calculateReadingTime(text)).toBe(1)
  })

  it('handles text with tabs and newlines', () => {
    const text = 'one\ttwo\nthree\r\nfour'
    expect(calculateReadingTime(text)).toBe(1)
  })
})
