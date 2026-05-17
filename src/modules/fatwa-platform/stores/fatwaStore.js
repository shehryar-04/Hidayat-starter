import { create } from 'zustand'
import { supabase } from '../../../lib/supabase'
import { incrementFatwaView } from '../utils/incrementView'
import { generateSlug } from '../utils/slugGenerator'

// Cache duration: 5 minutes in milliseconds
const CACHE_DURATION = 5 * 60 * 1000

/**
 * Slugify helper that supports Unicode (Urdu/Arabic) text.
 * Produces URL-friendly strings while preserving non-Latin characters.
 * Replaces slashes and spaces with hyphens to avoid URL path conflicts.
 */
function slugify(text) {
  if (!text || typeof text !== 'string') return ''

  return text
    .trim()
    .replace(/[/\\]+/g, '-')    // Replace slashes with hyphens
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/-+/g, '-')        // Collapse multiple hyphens
    .replace(/^-|-$/g, '')      // Trim leading/trailing hyphens
}

/**
 * Normalize a fatwa row from the `fatwas` table into the shape
 * expected by the platform components.
 */
function normalizeFatwa(row, existingSlugs) {
  const titleText = row.title || row.question || ''
  const slug = generateSlug(titleText, row.id, existingSlugs)
  existingSlugs.add(slug)
  return {
    id: String(row.id),
    title: row.title || row.question,
    slug,
    question_text: row.question,
    response_text: row.answer,
    fatwa_ref: row.fatwa_ref || null,
    category_1: row.category_1 || null,
    category_2: row.category_2 || null,
    category_3: row.category_3 || null,
    dar_ul_ifta: row.dar_ul_ifta || 'Hidayat Darul Ifta',
    view_count: row.view_count || 0,
    published_at: row.created_at,
    created_at: row.created_at,
    status: 'published',
  }
}

/**
 * Build a nested category tree from category rows (category_1, category_2, category_3, count).
 */
function buildCategoryTreeFromCounts(rows) {
  const tree = {}

  for (const row of rows) {
    const { category_1, category_2, category_3, count } = row
    if (!category_1) continue

    if (!tree[category_1]) {
      tree[category_1] = { name: category_1, slug: slugify(category_1), count: 0, children: {} }
    }
    tree[category_1].count += count

    if (category_2) {
      if (!tree[category_1].children[category_2]) {
        tree[category_1].children[category_2] = { name: category_2, slug: slugify(category_2), count: 0, children: {} }
      }
      tree[category_1].children[category_2].count += count

      if (category_3) {
        if (!tree[category_1].children[category_2].children[category_3]) {
          tree[category_1].children[category_2].children[category_3] = { name: category_3, slug: slugify(category_3), count: 0, children: {} }
        }
        tree[category_1].children[category_2].children[category_3].count += count
      }
    }
  }

  return tree
}

/**
 * Build category tree from a flat array of fatwas (fallback).
 */
function buildCategoryTree(fatwas) {
  const tree = {}

  for (const fatwa of fatwas) {
    const { category_1, category_2, category_3 } = fatwa
    if (!category_1) continue

    if (!tree[category_1]) {
      tree[category_1] = { name: category_1, slug: slugify(category_1), count: 0, children: {} }
    }
    tree[category_1].count++

    if (category_2) {
      if (!tree[category_1].children[category_2]) {
        tree[category_1].children[category_2] = { name: category_2, slug: slugify(category_2), count: 0, children: {} }
      }
      tree[category_1].children[category_2].count++

      if (category_3) {
        if (!tree[category_1].children[category_2].children[category_3]) {
          tree[category_1].children[category_2].children[category_3] = { name: category_3, slug: slugify(category_3), count: 0, children: {} }
        }
        tree[category_1].children[category_2].children[category_3].count++
      }
    }
  }

  return tree
}

export const useFatwaStore = create((set, get) => ({
  // Data
  fatwas: [],
  categories: {},
  loading: false,
  lastFetched: null,

  // Lightweight home page data
  latestFatwas: [],
  popularFatwas: [],
  totalCount: 0,
  institutionList: [],

  // Category page cache: { [categoryName]: fatwa[] }
  categoryFatwas: {},
  categoryLoading: false,

  // Actions

  /**
   * Fetch lightweight data for the home page:
   * - Categories with counts (via grouped query)
   * - Latest 6 fatwas
   * - Total count
   * - Institutions list
   * Does NOT fetch all 60k rows.
   */
  fetchFatwas: async () => {
    const { lastFetched, loading } = get()

    if (loading) return
    if (lastFetched && Date.now() - lastFetched < CACHE_DURATION) return

    set({ loading: true })

    try {
      // Fetch in parallel: latest fatwas, categories, total count, institutions
      const [latestRes, categoriesRes, countRes, institutionsRes] = await Promise.all([
        // Latest 6 fatwas
        supabase
          .from('fatwas')
          .select('id, title, question, answer, fatwa_ref, dar_ul_ifta, category_1, category_2, category_3, created_at')
          .order('created_at', { ascending: false })
          .limit(6),

        // All distinct category combinations with counts
        supabase.rpc('get_fatwa_category_counts'),

        // Total count
        supabase
          .from('fatwas')
          .select('id', { count: 'exact', head: true }),

        // Distinct institutions
        supabase
          .from('fatwas')
          .select('dar_ul_ifta')
          .not('dar_ul_ifta', 'is', null)
          .limit(1000),
      ])

      // Process latest fatwas
      const existingSlugs = new Set()
      const latestFatwas = (latestRes.data || []).map(row => normalizeFatwa(row, existingSlugs))

      // Process categories — use RPC if available, otherwise fallback
      let categories = {}
      if (categoriesRes.error) {
        // Fallback: paginate through all category columns (lightweight — only 3 small text fields per row)
        console.log('[FatwaStore] RPC not available, using fallback category fetch')
        const PAGE_SIZE = 1000
        let allCatData = []
        let from = 0
        let hasMore = true

        while (hasMore) {
          const { data: catData } = await supabase
            .from('fatwas')
            .select('category_1, category_2, category_3')
            .not('category_1', 'is', null)
            .range(from, from + PAGE_SIZE - 1)

          allCatData = allCatData.concat(catData || [])
          hasMore = catData && catData.length === PAGE_SIZE
          from += PAGE_SIZE
        }

        if (allCatData.length > 0) {
          // Count occurrences manually
          const countMap = {}
          for (const row of allCatData) {
            const key = `${row.category_1}||${row.category_2 || ''}||${row.category_3 || ''}`
            if (!countMap[key]) countMap[key] = { ...row, count: 0 }
            countMap[key].count++
          }
          categories = buildCategoryTreeFromCounts(Object.values(countMap))
        }
      } else {
        categories = buildCategoryTreeFromCounts(categoriesRes.data || [])
      }

      // Total count
      const totalCount = countRes.count || 0

      // Institutions
      const institutionSet = new Set()
      for (const row of (institutionsRes.data || [])) {
        if (row.dar_ul_ifta) institutionSet.add(row.dar_ul_ifta)
      }
      const institutionList = [...institutionSet]

      // Popular fatwas = same as latest for now (view_count not tracked in table yet)
      const popularFatwas = latestFatwas

      set({
        fatwas: latestFatwas,
        categories,
        latestFatwas,
        popularFatwas,
        totalCount,
        institutionList,
        loading: false,
        lastFetched: Date.now(),
      })
    } catch (err) {
      console.error('[FatwaStore] Unexpected error:', err)
      set({ loading: false })
    }
  },

  /**
   * Fetch fatwas for a specific category (on-demand when user navigates).
   * Caches results per category name.
   */
  fetchFatwasByCategory: async (cat1, cat2, cat3) => {
    const cacheKey = [cat1, cat2, cat3].filter(Boolean).join('||')
    const cached = get().categoryFatwas[cacheKey]
    if (cached) return cached

    set({ categoryLoading: true })

    try {
      let query = supabase
        .from('fatwas')
        .select('id, title, question, answer, fatwa_ref, dar_ul_ifta, category_1, category_2, category_3, created_at')
        .eq('category_1', cat1)
        .order('created_at', { ascending: false })
        .limit(200)

      if (cat2) query = query.eq('category_2', cat2)
      if (cat3) query = query.eq('category_3', cat3)

      const { data, error } = await query

      if (error) {
        console.error('[FatwaStore] Category fetch error:', error.message)
        set({ categoryLoading: false })
        return []
      }

      const existingSlugs = new Set()
      const fatwas = (data || []).map(row => normalizeFatwa(row, existingSlugs))

      // Cache the result
      set(state => ({
        categoryFatwas: { ...state.categoryFatwas, [cacheKey]: fatwas },
        categoryLoading: false,
      }))

      return fatwas
    } catch (err) {
      console.error('[FatwaStore] Category fetch error:', err)
      set({ categoryLoading: false })
      return []
    }
  },

  /**
   * Fetch a single fatwa by slug-matching.
   * Slugs are generated from the question/title text.
   */
  fetchFatwaBySlug: async (slug) => {
    // First check if we already have it in memory
    const existing = get().fatwas.find(f => f.slug === slug)
    if (existing) return existing

    // Also check category cache
    for (const fatwas of Object.values(get().categoryFatwas)) {
      const found = fatwas.find(f => f.slug === slug)
      if (found) return found
    }

    // Fetch from DB — search broadly and match slug client-side
    set({ loading: true })

    try {
      const { data, error } = await supabase
        .from('fatwas')
        .select('id, title, question, answer, fatwa_ref, dar_ul_ifta, category_1, category_2, category_3, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        set({ loading: false })
        return null
      }

      const existingSlugs = new Set()
      const fatwas = (data || []).map(row => normalizeFatwa(row, existingSlugs))
      const found = fatwas.find(f => f.slug === slug)

      if (found) {
        // Add to local cache
        set(state => ({
          fatwas: [...state.fatwas.filter(f => f.id !== found.id), found],
          loading: false,
        }))
        return found
      }

      set({ loading: false })
      return null
    } catch (err) {
      set({ loading: false })
      return null
    }
  },

  /**
   * Increment view count for a fatwa.
   */
  incrementView: async (id) => {
    await incrementFatwaView(id)
  },

  /**
   * Get the computed category tree.
   */
  getCategoryTree: () => {
    return get().categories
  },

  /**
   * Find a fatwa by its slug from local state.
   */
  getFatwaBySlug: (slug) => {
    const { fatwas, categoryFatwas } = get()
    const found = fatwas.find(f => f.slug === slug)
    if (found) return found

    // Search category cache
    for (const cached of Object.values(categoryFatwas)) {
      const f = cached.find(f => f.slug === slug)
      if (f) return f
    }
    return undefined
  },

  /**
   * Filter fatwas by category hierarchy (from local cache).
   */
  getFatwasByCategory: (cat1, cat2, cat3) => {
    const cacheKey = [cat1, cat2, cat3].filter(Boolean).join('||')
    const cached = get().categoryFatwas[cacheKey]
    if (cached) return cached

    // Fallback: filter from whatever we have in memory
    return get().fatwas.filter(f => {
      if (f.category_1 !== cat1) return false
      if (cat2 && f.category_2 !== cat2) return false
      if (cat3 && f.category_3 !== cat3) return false
      return true
    })
  },
}))
