import { useState, useEffect, useRef, useCallback } from 'react'
import {
  searchFatwas,
  getSuggestions,
  getSearchFacets,
  logSearchQuery,
  logSearchClick,
  getSearchSessionId,
} from '../services/searchService'

const SEARCH_DEBOUNCE_MS = 300
const SUGGEST_DEBOUNCE_MS = 150

/**
 * useEnterpriseSearch — Server-side hybrid search hook.
 *
 * Corrected architecture:
 * - Trigram search (45%) for Urdu/Arabic (FIRST-CLASS)
 * - FTS (25%) for English + structured text
 * - Vector search (30%) for semantic similarity (when embeddings available)
 * - Precomputed suggestions from search_suggestions table
 * - Faceted filters via trigram-based counting
 * - Analytics: query logging + click tracking
 *
 * @param {string} query
 * @param {{ limit?: number, page?: number, filters?: Object }} options
 */
export function useEnterpriseSearch(query, options = {}) {
  const { limit = 20, page = 1, filters = {} } = options

  const [results, setResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [facets, setFacets] = useState({})
  const [total, setTotal] = useState(0)
  const [latencyMs, setLatencyMs] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [error, setError] = useState(null)
  const [queryId, setQueryId] = useState(null)

  const searchTimer = useRef(null)
  const suggestTimer = useRef(null)

  // Serialize filters for dependency comparison
  const filterKey = JSON.stringify(filters)

  // ─── Debounced search ──────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)

    if (!query || !query.trim()) {
      setResults([])
      setTotal(0)
      setFacets({})
      setError(null)
      setIsSearching(false)
      setLatencyMs(null)
      return
    }

    setIsSearching(true)
    setError(null)

    searchTimer.current = setTimeout(async () => {
      try {
        const offset = (page - 1) * limit

        const [searchRes, facetsRes] = await Promise.all([
          searchFatwas(query.trim(), { limit, offset, filters }),
          getSearchFacets(query.trim()),
        ])

        setResults(searchRes.results || [])
        setTotal(searchRes.total || 0)
        setLatencyMs(searchRes.latency_ms || null)
        setFacets(facetsRes.facets || {})
        setIsSearching(false)

        // Log analytics (non-blocking)
        const sessionId = getSearchSessionId()
        logSearchQuery(
          query.trim(),
          searchRes.total || 0,
          searchRes.latency_ms,
          Object.keys(filters).length > 0 ? filters : undefined,
          sessionId
        ).then(res => {
          if (res.query_id) setQueryId(res.query_id)
        })
      } catch (err) {
        setError(err.message || 'Search failed')
        setIsSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [query, limit, page, filterKey])

  // ─── Debounced suggestions (faster) ────────────────────────
  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current)

    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setIsSuggesting(false)
      return
    }

    setIsSuggesting(true)

    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await getSuggestions(query.trim(), 7)
        setSuggestions(res.suggestions || [])
      } catch {
        setSuggestions([])
      }
      setIsSuggesting(false)
    }, SUGGEST_DEBOUNCE_MS)

    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current) }
  }, [query])

  // ─── Click tracking ────────────────────────────────────────
  const logClick = useCallback((fatwaId, position) => {
    if (queryId) logSearchClick(queryId, fatwaId, position)
  }, [queryId])

  return {
    results,
    suggestions,
    facets,
    total,
    latencyMs,
    isSearching,
    isSuggesting,
    error,
    queryId,
    logClick,
    hasMore: total > page * limit,
  }
}
