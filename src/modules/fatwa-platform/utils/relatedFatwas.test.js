import { describe, it, expect } from 'vitest'
import { getRelatedFatwas } from './relatedFatwas.js'

describe('getRelatedFatwas', () => {
  const makeFatwa = (id, cat1, cat2, cat3) => ({
    id,
    title: `Fatwa ${id}`,
    category_1: cat1,
    category_2: cat2,
    category_3: cat3,
  })

  const currentFatwa = makeFatwa('current', 'Worship', 'Prayer', 'Missed Prayers')

  it('excludes the current fatwa from results', () => {
    const allFatwas = [
      currentFatwa,
      makeFatwa('a', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('b', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('c', 'Worship', 'Prayer', 'Missed Prayers'),
    ]

    const result = getRelatedFatwas(currentFatwa, allFatwas)
    expect(result.find((f) => f.id === 'current')).toBeUndefined()
  })

  it('returns at most maxCount results', () => {
    const allFatwas = Array.from({ length: 10 }, (_, i) =>
      makeFatwa(`f${i}`, 'Worship', 'Prayer', 'Missed Prayers')
    )

    const result = getRelatedFatwas(currentFatwa, allFatwas, 6)
    expect(result.length).toBeLessThanOrEqual(6)
  })

  it('returns at most maxCount=3 when specified', () => {
    const allFatwas = Array.from({ length: 10 }, (_, i) =>
      makeFatwa(`f${i}`, 'Worship', 'Prayer', 'Missed Prayers')
    )

    const result = getRelatedFatwas(currentFatwa, allFatwas, 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('prioritizes category_3 matches', () => {
    const allFatwas = [
      makeFatwa('cat3-a', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('cat3-b', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('cat3-c', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('cat2-a', 'Worship', 'Prayer', 'Congregation'),
      makeFatwa('cat2-b', 'Worship', 'Prayer', 'Congregation'),
    ]

    const result = getRelatedFatwas(currentFatwa, allFatwas)

    // All cat3 matches should come before cat2-only matches
    const cat3Indices = result
      .filter((f) => f.category_3 === 'Missed Prayers')
      .map((f) => result.indexOf(f))
    const cat2OnlyIndices = result
      .filter((f) => f.category_3 !== 'Missed Prayers')
      .map((f) => result.indexOf(f))

    if (cat3Indices.length > 0 && cat2OnlyIndices.length > 0) {
      expect(Math.max(...cat3Indices)).toBeLessThan(Math.min(...cat2OnlyIndices))
    }
  })

  it('supplements with category_2 when fewer than 3 share category_3', () => {
    const allFatwas = [
      makeFatwa('cat3-a', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('cat3-b', 'Worship', 'Prayer', 'Missed Prayers'),
      // Only 2 from cat3, so should supplement with cat2
      makeFatwa('cat2-a', 'Worship', 'Prayer', 'Congregation'),
      makeFatwa('cat2-b', 'Worship', 'Prayer', 'Congregation'),
    ]

    const result = getRelatedFatwas(currentFatwa, allFatwas)

    // Should include both cat3 matches and cat2 supplements
    expect(result.length).toBe(4)
    expect(result[0].id).toBe('cat3-a')
    expect(result[1].id).toBe('cat3-b')
    expect(result[2].id).toBe('cat2-a')
    expect(result[3].id).toBe('cat2-b')
  })

  it('does not supplement with category_2 when 3+ share category_3', () => {
    const allFatwas = [
      makeFatwa('cat3-a', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('cat3-b', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('cat3-c', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('cat2-a', 'Worship', 'Prayer', 'Congregation'),
    ]

    const result = getRelatedFatwas(currentFatwa, allFatwas)

    // Should only include cat3 matches (3 available, no supplementing needed)
    expect(result.every((f) => f.category_3 === 'Missed Prayers')).toBe(true)
  })

  it('returns empty array when no related fatwas exist', () => {
    const allFatwas = [
      currentFatwa,
      makeFatwa('unrelated', 'Finance', 'Banking', 'Interest'),
    ]

    const result = getRelatedFatwas(currentFatwa, allFatwas)
    expect(result).toEqual([])
  })

  it('returns empty array for null/undefined inputs', () => {
    expect(getRelatedFatwas(null, [])).toEqual([])
    expect(getRelatedFatwas(undefined, [])).toEqual([])
    expect(getRelatedFatwas(currentFatwa, null)).toEqual([])
    expect(getRelatedFatwas(currentFatwa, undefined)).toEqual([])
  })

  it('handles fatwas with null category_3 gracefully', () => {
    const fatwaNoCategory3 = makeFatwa('no-cat3', 'Worship', 'Prayer', null)
    const allFatwas = [
      makeFatwa('a', 'Worship', 'Prayer', null),
      makeFatwa('b', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('c', 'Worship', 'Prayer', 'Congregation'),
    ]

    // When current fatwa has null category_3, no cat3 matches, supplements from cat2
    const result = getRelatedFatwas(fatwaNoCategory3, allFatwas)
    expect(result.every((f) => f.category_2 === 'Prayer')).toBe(true)
    expect(result.find((f) => f.id === 'no-cat3')).toBeUndefined()
  })

  it('does not include duplicates in results', () => {
    const allFatwas = [
      makeFatwa('a', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('b', 'Worship', 'Prayer', 'Missed Prayers'),
      makeFatwa('c', 'Worship', 'Prayer', 'Congregation'),
    ]

    const result = getRelatedFatwas(currentFatwa, allFatwas)
    const ids = result.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
