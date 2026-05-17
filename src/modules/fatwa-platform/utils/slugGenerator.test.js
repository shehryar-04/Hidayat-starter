import { describe, it, expect } from 'vitest'
import { generateSlug } from './slugGenerator.js'

describe('generateSlug', () => {
  it('converts a simple title to a slug', () => {
    const slug = generateSlug('Prayer Times in Islam', '001', new Set())
    expect(slug).toBe('prayer-times-in-islam')
  })

  it('removes special characters', () => {
    const slug = generateSlug('What is Zakāt? (Charity)', '002', new Set())
    expect(slug).toBe('what-is-zakt-charity')
  })

  it('collapses multiple spaces and hyphens', () => {
    const slug = generateSlug('Fasting   in---Ramadan', '003', new Set())
    expect(slug).toBe('fasting-in-ramadan')
  })

  it('trims leading and trailing hyphens', () => {
    const slug = generateSlug('---hello world---', '004', new Set())
    expect(slug).toBe('hello-world')
  })

  it('truncates to 80 characters max', () => {
    const longTitle = 'a'.repeat(100)
    const slug = generateSlug(longTitle, '005', new Set())
    expect(slug.length).toBeLessThanOrEqual(80)
  })

  it('appends fatwa number when slug already exists', () => {
    const existingSlugs = new Set(['prayer-times'])
    const slug = generateSlug('Prayer Times', '006', existingSlugs)
    expect(slug).toBe('prayer-times-006')
  })

  it('handles empty string input', () => {
    const slug = generateSlug('', '007', new Set())
    expect(slug).toBe('fatwa-007')
  })

  it('handles all-special-character input', () => {
    const slug = generateSlug('!@#$%^&*()', '008', new Set())
    expect(slug).toBe('fatwa-008')
  })

  it('handles Unicode/Arabic input by removing non-latin chars', () => {
    const slug = generateSlug('حكم الصلاة', '009', new Set())
    expect(slug).toBe('fatwa-009')
  })

  it('handles mixed Latin and Arabic input', () => {
    const slug = generateSlug('Ruling on صلاة Prayer', '010', new Set())
    expect(slug).toBe('ruling-on-prayer')
  })

  it('produces only lowercase alphanumeric and hyphens', () => {
    const slug = generateSlug('UPPERCASE Title With Numbers 123', '011', new Set())
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('ensures uniqueness with different fatwa numbers', () => {
    const existingSlugs = new Set(['same-title'])
    const slug1 = generateSlug('Same Title', '100', existingSlugs)
    const slug2 = generateSlug('Same Title', '200', existingSlugs)
    expect(slug1).not.toBe(slug2)
  })
})
