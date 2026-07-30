import { useState, useEffect, useRef, useCallback } from 'react'
import {
  searchFatwas,
  getSuggestions,
  getSearchFacets,
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
  const requestVersion = useRef(0)

  // Serialize filters for dependency comparison
  const filterKey = JSON.stringify(filters)

  // ─── Debounced search ──────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const version = ++requestVersion.current
    let cancelled = false

    setQueryId(null)
    if (!query || !query.trim()) {
      setResults([])
      setTotal(0)
      setFacets({})
      setError(null)
      setIsSearching(false)
      setLatencyMs(null)
      return () => { cancelled = true }
    }

    setIsSearching(true)
    setError(null)

    searchTimer.current = setTimeout(async () => {
      const offset = (page - 1) * limit
      const normalizedQuery = query.trim()

      // Facets start at the same time, but are optional and never block results.
      const facetsPromise = getSearchFacets(normalizedQuery).catch(() => ({ facets: {} }))

      try {
        const searchRes = await searchFatwas(normalizedQuery, {
          limit,
          offset,
          filters,
          sessionId: getSearchSessionId(),
        })

        if (cancelled || version !== requestVersion.current) return
        setResults(searchRes.results || [])
        setTotal(searchRes.total || 0)
        setLatencyMs(searchRes.latency_ms ?? null)
        setQueryId(searchRes.query_id || null)
        setIsSearching(false)

        const facetsRes = await facetsPromise
        if (!cancelled && version === requestVersion.current) {
          setFacets(facetsRes.facets || {})
        }
      } catch (err) {
        if (cancelled || version !== requestVersion.current) return
        setError(err.message || 'Search failed')
        setIsSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
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
