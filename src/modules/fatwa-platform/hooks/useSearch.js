import { useState, useMemo, useEffect, useRef } from 'react'
import Fuse from 'fuse.js'
import { useFatwaStore } from '../stores/fatwaStore'

/**
 * Fuse.js configuration for fatwa search.
 * - threshold: 0.4 allows minor typos (edit distance ~1)
 * - distance: 100 matches within first 100 chars for relevance
 * - keys weighted: title (0.4), question_text (0.3), response_text (0.2), category_1 (0.1)
 * - Additional unweighted keys for broader matching
 */
const FUSE_OPTIONS = {
  threshold: 0.4,
  distance: 100,
  includeScore: true,
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'question_text', weight: 0.3 },
    { name: 'response_text', weight: 0.2 },
    { name: 'category_1', weight: 0.1 },
    { name: 'dar_ul_ifta', weight: 0.05 },
    { name: 'category_2', weight: 0.05 },
    { name: 'category_3', weight: 0.05 },
  ],
}

const DEBOUNCE_MS = 300
const DEFAULT_LIMIT = 20
const DEFAULT_SUGGESTION_LIMIT = 5

/**
 * useSearch hook — provides client-side fuzzy search over fatwas using Fuse.js.
 *
 * @param {string} query - The search query string
 * @param {object} [options] - Search options
 * @param {number} [options.limit=20] - Maximum number of results to return
 * @param {number} [options.suggestionLimit=5] - Maximum autocomplete suggestions
 * @param {string} [options.category_1] - Filter results by category_1
 * @param {string} [options.dar_ul_ifta] - Filter results by dar_ul_ifta
 * @returns {{ results: object[], suggestions: object[], isSearching: boolean }}
 */
export function useSearch(query, options = {}) {
  const {
    limit = DEFAULT_LIMIT,
    suggestionLimit = DEFAULT_SUGGESTION_LIMIT,
    category_1,
    dar_ul_ifta,
  } = options

  const fatwas = useFatwaStore((state) => state.fatwas)

  const [results, setResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const timerRef = useRef(null)

  // Build Fuse index from fatwas — recomputed only when fatwas change
  const fuse = useMemo(() => {
    return new Fuse(fatwas, FUSE_OPTIONS)
  }, [fatwas])

  // Debounced search effect
  useEffect(() => {
    // Clear any pending debounce timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // If query is empty or only whitespace, reset results
    if (!query || !query.trim()) {
      setResults([])
      setSuggestions([])
      setIsSearching(false)
      return
    }

    // Mark as searching (debounce pending)
    setIsSearching(true)

    timerRef.current = setTimeout(() => {
      const searchResults = fuse.search(query.trim())

      // Apply filters to results
      let filtered = searchResults
      if (category_1) {
        filtered = filtered.filter(
          (result) => result.item.category_1 === category_1
        )
      }
      if (dar_ul_ifta) {
        filtered = filtered.filter(
          (result) => result.item.dar_ul_ifta === dar_ul_ifta
        )
      }

      // Limit results
      const limitedResults = filtered.slice(0, limit).map((result) => result.item)

      // Generate suggestions (top N matching fatwa titles for autocomplete)
      const limitedSuggestions = filtered
        .slice(0, suggestionLimit)
        .map((result) => ({
          title: result.item.title,
          slug: result.item.slug,
          id: result.item.id,
        }))

      setResults(limitedResults)
      setSuggestions(limitedSuggestions)
      setIsSearching(false)
    }, DEBOUNCE_MS)

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [query, fuse, limit, suggestionLimit, category_1, dar_ul_ifta])

  return { results, suggestions, isSearching }
}
