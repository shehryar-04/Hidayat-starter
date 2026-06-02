/**
 * Hidayat Enterprise Search Service (Corrected Architecture)
 *
 * Client for the search Edge Function.
 * Pipeline: Trigram (Urdu/Arabic) + FTS (English) + Vector (semantic)
 *
 * NO LLM. NO AI generation. Pure retrieval.
 */

const SEARCH_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search`
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Call the search Edge Function.
 */
async function callSearchAPI(body) {
  const response = await fetch(SEARCH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `Search API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Perform hybrid search across all fatwas.
 * Combines: Trigram (45%) + FTS (25%) + Vector (30%) + Category boost.
 *
 * @param {string} query - Search query (Urdu, Arabic, or English)
 * @param {Object} [options]
 * @param {number} [options.limit=20]
 * @param {number} [options.offset=0]
 * @param {Object} [options.filters] - { category_1, category_2, category_3, dar_ul_ifta }
 * @param {number[]} [options.embedding] - Optional embedding vector for semantic search
 * @returns {Promise<{ results: Array, total: number, query: string, latency_ms: number, mode: string }>}
 */
export async function searchFatwas(query, options = {}) {
  const { limit = 20, offset = 0, filters = {}, embedding } = options

  return callSearchAPI({
    action: 'search',
    query,
    limit,
    offset,
    category_1: filters.category_1,
    category_2: filters.category_2,
    category_3: filters.category_3,
    dar_ul_ifta: filters.dar_ul_ifta,
    embedding,
  })
}

/**
 * Get autocomplete suggestions from precomputed table.
 * Served in <100ms.
 *
 * @param {string} query - Partial query (min 2 chars)
 * @param {number} [limit=7]
 * @returns {Promise<{ suggestions: Array<{ term: string, frequency: number, source: string }> }>}
 */
export async function getSuggestions(query, limit = 7) {
  if (!query || query.trim().length < 2) {
    return { suggestions: [] }
  }

  return callSearchAPI({ action: 'suggest', query, limit })
}

/**
 * Get faceted filter counts for a search query.
 * Uses trigram matching for Urdu/Arabic compatibility.
 *
 * @param {string} query
 * @returns {Promise<{ facets: { category?: Array, institution?: Array } }>}
 */
export async function getSearchFacets(query) {
  if (!query || query.trim().length === 0) {
    return { facets: {} }
  }

  return callSearchAPI({ action: 'facets', query })
}

/**
 * Get semantically related fatwas (chunk-based vector similarity).
 *
 * @param {string} fatwaId - UUID
 * @param {number} [limit=10]
 * @returns {Promise<{ related: Array }>}
 */
export async function getRelatedFatwas(fatwaId, limit = 10) {
  if (!fatwaId) return { related: [] }
  return callSearchAPI({ action: 'related', fatwa_id: fatwaId, limit })
}

/**
 * Log a search query for analytics (non-blocking).
 */
export async function logSearchQuery(query, resultsCount, latencyMs, filters, sessionId) {
  try {
    return await callSearchAPI({
      action: 'log_query',
      query,
      results_count: resultsCount,
      latency_ms: latencyMs,
      filters,
      session_id: sessionId,
    })
  } catch {
    return { ok: false }
  }
}

/**
 * Log a search result click for analytics (non-blocking).
 */
export async function logSearchClick(queryId, fatwaId, position) {
  try {
    return await callSearchAPI({
      action: 'log_click',
      query_id: queryId,
      fatwa_id: fatwaId,
      position,
    })
  } catch {
    return { ok: false }
  }
}

/**
 * Get or create a session ID for analytics.
 */
export function getSearchSessionId() {
  const KEY = 'hidayat_search_session'
  let id = sessionStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(KEY, id)
  }
  return id
}
