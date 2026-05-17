import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFatwaStore } from './fatwaStore'

// Mock supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}))

// Mock incrementView utility
vi.mock('../utils/incrementView', () => ({
  incrementFatwaView: vi.fn(() => Promise.resolve()),
}))

/**
 * Helper to set fatwas with computed derived values (mimics what fetchFatwas does)
 */
function setFatwasWithDerived(fatwas) {
  const latestFatwas = [...fatwas]
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 6)
  const popularFatwas = [...fatwas]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 6)
  const totalCount = fatwas.length
  const institutions = new Set()
  for (const fatwa of fatwas) {
    if (fatwa.dar_ul_ifta) institutions.add(fatwa.dar_ul_ifta)
  }
  const institutionList = [...institutions]

  useFatwaStore.setState({
    fatwas,
    latestFatwas,
    popularFatwas,
    totalCount,
    institutionList,
  })
}

const sampleFatwas = [
  {
    id: '1',
    title: 'Prayer Times',
    slug: 'prayer-times',
    question_text: 'When to pray?',
    category_1: 'Worship',
    category_2: 'Prayer',
    category_3: 'Times',
    dar_ul_ifta: 'Hidayat Darul Ifta',
    view_count: 100,
    published_at: '2024-01-10T00:00:00Z',
    status: 'published',
  },
  {
    id: '2',
    title: 'Fasting Rules',
    slug: 'fasting-rules',
    question_text: 'What breaks a fast?',
    category_1: 'Worship',
    category_2: 'Fasting',
    category_3: 'Rules',
    dar_ul_ifta: 'Hidayat Darul Ifta',
    view_count: 50,
    published_at: '2024-01-15T00:00:00Z',
    status: 'published',
  },
  {
    id: '3',
    title: 'Zakat Calculation',
    slug: 'zakat-calculation',
    question_text: 'How to calculate zakat?',
    category_1: 'Worship',
    category_2: 'Zakat',
    category_3: 'Calculation',
    dar_ul_ifta: 'Darul Uloom Karachi',
    view_count: 200,
    published_at: '2024-01-20T00:00:00Z',
    status: 'published',
  },
  {
    id: '4',
    title: 'Marriage Contract',
    slug: 'marriage-contract',
    question_text: 'What are the conditions?',
    category_1: 'Family',
    category_2: 'Marriage',
    category_3: 'Contract',
    dar_ul_ifta: 'Darul Uloom Karachi',
    view_count: 75,
    published_at: '2024-01-05T00:00:00Z',
    status: 'published',
  },
  {
    id: '5',
    title: 'Inheritance Law',
    slug: 'inheritance-law',
    question_text: 'How is inheritance divided?',
    category_1: 'Family',
    category_2: 'Inheritance',
    category_3: 'Division',
    dar_ul_ifta: 'Hidayat Darul Ifta',
    view_count: 30,
    published_at: '2024-01-25T00:00:00Z',
    status: 'published',
  },
  {
    id: '6',
    title: 'Business Ethics',
    slug: 'business-ethics',
    question_text: 'What is halal business?',
    category_1: 'Commerce',
    category_2: 'Ethics',
    category_3: 'General',
    dar_ul_ifta: 'Jamia Binoria',
    view_count: 10,
    published_at: '2024-01-30T00:00:00Z',
    status: 'published',
  },
  {
    id: '7',
    title: 'Missed Prayers',
    slug: 'missed-prayers',
    question_text: 'How to make up missed prayers?',
    category_1: 'Worship',
    category_2: 'Prayer',
    category_3: 'Missed',
    dar_ul_ifta: 'Hidayat Darul Ifta',
    view_count: 150,
    published_at: '2024-02-01T00:00:00Z',
    status: 'published',
  },
]

describe('fatwaStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useFatwaStore.setState({
      fatwas: [],
      categories: {},
      loading: false,
      lastFetched: null,
      latestFatwas: [],
      popularFatwas: [],
      totalCount: 0,
      institutionList: [],
    })
  })

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = useFatwaStore.getState()
      expect(state.fatwas).toEqual([])
      expect(state.categories).toEqual({})
      expect(state.loading).toBe(false)
      expect(state.lastFetched).toBeNull()
    })
  })

  describe('latestFatwas', () => {
    it('should return 6 most recent fatwas sorted by published_at descending', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const latest = state.latestFatwas

      expect(latest).toHaveLength(6)
      // Most recent first
      expect(latest[0].id).toBe('7') // 2024-02-01
      expect(latest[1].id).toBe('6') // 2024-01-30
      expect(latest[2].id).toBe('5') // 2024-01-25
    })
  })

  describe('popularFatwas', () => {
    it('should return 6 fatwas with highest view_count', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const popular = state.popularFatwas

      expect(popular).toHaveLength(6)
      // Highest view_count first
      expect(popular[0].id).toBe('3') // 200 views
      expect(popular[1].id).toBe('7') // 150 views
      expect(popular[2].id).toBe('1') // 100 views
    })
  })

  describe('totalCount', () => {
    it('should return the total number of fatwas', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      expect(state.totalCount).toBe(7)
    })

    it('should return 0 when no fatwas', () => {
      const state = useFatwaStore.getState()
      expect(state.totalCount).toBe(0)
    })
  })

  describe('institutionList', () => {
    it('should return unique dar_ul_ifta values', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const institutions = state.institutionList

      expect(institutions).toHaveLength(3)
      expect(institutions).toContain('Hidayat Darul Ifta')
      expect(institutions).toContain('Darul Uloom Karachi')
      expect(institutions).toContain('Jamia Binoria')
    })
  })

  describe('getFatwaBySlug', () => {
    it('should find a fatwa by slug', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const fatwa = state.getFatwaBySlug('zakat-calculation')

      expect(fatwa).toBeDefined()
      expect(fatwa.id).toBe('3')
      expect(fatwa.title).toBe('Zakat Calculation')
    })

    it('should return undefined for non-existent slug', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const fatwa = state.getFatwaBySlug('non-existent')

      expect(fatwa).toBeUndefined()
    })
  })

  describe('getFatwasByCategory', () => {
    it('should filter by category_1 only', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const results = state.getFatwasByCategory('Worship')

      expect(results).toHaveLength(4)
      results.forEach((f) => expect(f.category_1).toBe('Worship'))
    })

    it('should filter by category_1 and category_2', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const results = state.getFatwasByCategory('Worship', 'Prayer')

      expect(results).toHaveLength(2)
      results.forEach((f) => {
        expect(f.category_1).toBe('Worship')
        expect(f.category_2).toBe('Prayer')
      })
    })

    it('should filter by all three category levels', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const results = state.getFatwasByCategory('Worship', 'Prayer', 'Times')

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('1')
    })

    it('should return empty array for non-matching category', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const results = state.getFatwasByCategory('NonExistent')

      expect(results).toHaveLength(0)
    })
  })

  describe('getCategoryTree', () => {
    it('should build a correct category tree', () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()
      const tree = state.getCategoryTree()

      // Top-level categories
      expect(Object.keys(tree)).toContain('Worship')
      expect(Object.keys(tree)).toContain('Family')
      expect(Object.keys(tree)).toContain('Commerce')

      // Worship has 4 fatwas
      expect(tree['Worship'].count).toBe(4)

      // Worship > Prayer has 2 fatwas
      expect(tree['Worship'].children['Prayer'].count).toBe(2)

      // Worship > Prayer > Times has 1 fatwa
      expect(tree['Worship'].children['Prayer'].children['Times'].count).toBe(1)
    })

    it('should return empty object when no fatwas', () => {
      const state = useFatwaStore.getState()
      const tree = state.getCategoryTree()
      expect(tree).toEqual({})
    })
  })

  describe('incrementView', () => {
    it('should increment view_count in local state', async () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()

      await state.incrementView('1')

      const updated = useFatwaStore.getState()
      const fatwa = updated.fatwas.find((f) => f.id === '1')
      expect(fatwa.view_count).toBe(101)
    })

    it('should not affect other fatwas when incrementing', async () => {
      setFatwasWithDerived(sampleFatwas)
      const state = useFatwaStore.getState()

      await state.incrementView('1')

      const updated = useFatwaStore.getState()
      const other = updated.fatwas.find((f) => f.id === '2')
      expect(other.view_count).toBe(50)
    })
  })

  describe('fetchFatwas caching', () => {
    it('should not refetch if cache is fresh', async () => {
      const { supabase } = await import('../../../lib/supabase')

      // Set lastFetched to now (fresh cache)
      useFatwaStore.setState({
        fatwas: sampleFatwas,
        lastFetched: Date.now(),
      })

      const state = useFatwaStore.getState()
      await state.fetchFatwas()

      // supabase.from should not be called since cache is fresh
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('should not fetch if already loading', async () => {
      const { supabase } = await import('../../../lib/supabase')
      supabase.from.mockClear()

      useFatwaStore.setState({ loading: true })

      const state = useFatwaStore.getState()
      await state.fetchFatwas()

      expect(supabase.from).not.toHaveBeenCalled()
    })
  })
})
