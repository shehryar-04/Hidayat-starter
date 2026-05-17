import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCategories, getCategoryPath } from './useCategories'

// Mock the fatwa store
vi.mock('../stores/fatwaStore', () => ({
  useFatwaStore: vi.fn(),
}))

import { useFatwaStore } from '../stores/fatwaStore'

const sampleFatwas = [
  { id: '1', category_1: 'عبادات / Worship', category_2: 'نماز / Prayer', category_3: 'قضا نماز / Missed Prayers' },
  { id: '2', category_1: 'عبادات / Worship', category_2: 'نماز / Prayer', category_3: 'قضا نماز / Missed Prayers' },
  { id: '3', category_1: 'عبادات / Worship', category_2: 'نماز / Prayer', category_3: 'جماعت / Congregation' },
  { id: '4', category_1: 'عبادات / Worship', category_2: 'روزہ / Fasting', category_3: null },
  { id: '5', category_1: 'معاملات / Transactions', category_2: 'بیع / Sale', category_3: 'آن لائن / Online' },
  { id: '6', category_1: null, category_2: null, category_3: null }, // should be skipped
]

describe('useCategories', () => {
  beforeEach(() => {
    useFatwaStore.mockImplementation((selector) => selector({ fatwas: sampleFatwas }))
  })

  it('computes a 3-level category tree from flat fatwa data', () => {
    const { result } = renderHook(() => useCategories())
    const { tree } = result.current

    // Top-level categories
    expect(tree['عبادات / Worship']).toBeDefined()
    expect(tree['معاملات / Transactions']).toBeDefined()
    expect(Object.keys(tree)).toHaveLength(2)
  })

  it('counts fatwas including descendants at each level', () => {
    const { result } = renderHook(() => useCategories())
    const { tree } = result.current

    // Worship has 4 fatwas total (ids 1,2,3,4)
    expect(tree['عبادات / Worship'].count).toBe(4)

    // Prayer has 3 fatwas (ids 1,2,3)
    expect(tree['عبادات / Worship'].children['نماز / Prayer'].count).toBe(3)

    // Missed Prayers has 2 fatwas (ids 1,2)
    expect(tree['عبادات / Worship'].children['نماز / Prayer'].children['قضا نماز / Missed Prayers'].count).toBe(2)

    // Congregation has 1 fatwa (id 3)
    expect(tree['عبادات / Worship'].children['نماز / Prayer'].children['جماعت / Congregation'].count).toBe(1)

    // Fasting has 1 fatwa (id 4) - no category_3
    expect(tree['عبادات / Worship'].children['روزہ / Fasting'].count).toBe(1)

    // Transactions has 1 fatwa (id 5)
    expect(tree['معاملات / Transactions'].count).toBe(1)
  })

  it('generates slugs for each category node', () => {
    const { result } = renderHook(() => useCategories())
    const { tree } = result.current

    expect(tree['عبادات / Worship'].slug).toBe('worship')
    expect(tree['عبادات / Worship'].children['نماز / Prayer'].slug).toBe('prayer')
    expect(tree['معاملات / Transactions'].slug).toBe('transactions')
  })

  it('returns a flat list of top-level categories', () => {
    const { result } = renderHook(() => useCategories())
    const { topLevelCategories } = result.current

    expect(topLevelCategories).toHaveLength(2)
    expect(topLevelCategories[0].name).toBe('عبادات / Worship')
    expect(topLevelCategories[1].name).toBe('معاملات / Transactions')
  })

  it('skips fatwas with no category_1', () => {
    const { result } = renderHook(() => useCategories())
    const { tree } = result.current

    // Only 2 top-level categories, fatwa with null category_1 is skipped
    expect(Object.keys(tree)).toHaveLength(2)
  })

  it('handles empty fatwas array', () => {
    useFatwaStore.mockImplementation((selector) => selector({ fatwas: [] }))

    const { result } = renderHook(() => useCategories())
    const { tree, topLevelCategories } = result.current

    expect(tree).toEqual({})
    expect(topLevelCategories).toEqual([])
  })
})

describe('getCategoryPath', () => {
  let tree

  beforeEach(() => {
    useFatwaStore.mockImplementation((selector) => selector({ fatwas: sampleFatwas }))
    const { result } = renderHook(() => useCategories())
    tree = result.current.tree
  })

  it('returns empty array when cat1 is not provided', () => {
    expect(getCategoryPath(tree, null)).toEqual([])
    expect(getCategoryPath(tree, undefined)).toEqual([])
  })

  it('returns empty array when cat1 does not exist in tree', () => {
    expect(getCategoryPath(tree, 'Nonexistent')).toEqual([])
  })

  it('returns path with one segment for cat1 only', () => {
    const path = getCategoryPath(tree, 'عبادات / Worship')

    expect(path).toHaveLength(1)
    expect(path[0].name).toBe('عبادات / Worship')
    expect(path[0].slug).toBe('worship')
    expect(path[0].path).toBe('/fatwas/category/worship')
  })

  it('returns path with two segments for cat1 + cat2', () => {
    const path = getCategoryPath(tree, 'عبادات / Worship', 'نماز / Prayer')

    expect(path).toHaveLength(2)
    expect(path[0].name).toBe('عبادات / Worship')
    expect(path[1].name).toBe('نماز / Prayer')
    expect(path[1].path).toBe('/fatwas/category/worship/prayer')
  })

  it('returns path with three segments for cat1 + cat2 + cat3', () => {
    const path = getCategoryPath(tree, 'عبادات / Worship', 'نماز / Prayer', 'قضا نماز / Missed Prayers')

    expect(path).toHaveLength(3)
    expect(path[0].name).toBe('عبادات / Worship')
    expect(path[1].name).toBe('نماز / Prayer')
    expect(path[2].name).toBe('قضا نماز / Missed Prayers')
    expect(path[2].path).toBe('/fatwas/category/worship/prayer/missed-prayers')
  })

  it('stops at cat1 if cat2 does not exist in tree', () => {
    const path = getCategoryPath(tree, 'عبادات / Worship', 'Nonexistent')

    expect(path).toHaveLength(1)
    expect(path[0].name).toBe('عبادات / Worship')
  })

  it('stops at cat2 if cat3 does not exist in tree', () => {
    const path = getCategoryPath(tree, 'عبادات / Worship', 'نماز / Prayer', 'Nonexistent')

    expect(path).toHaveLength(2)
    expect(path[1].name).toBe('نماز / Prayer')
  })
})
