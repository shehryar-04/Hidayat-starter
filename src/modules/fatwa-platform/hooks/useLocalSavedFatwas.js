import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'hidayat_saved_fatwas'

/**
 * useLocalSavedFatwas — localStorage-based fatwa saving.
 * No login required. Saved fatwas persist in the browser only.
 * Clearing browser storage removes all saved fatwas.
 *
 * Stores a compact version of each fatwa (id, title, slug, category, saved date)
 * to keep localStorage usage reasonable even with many saved items.
 */
export function useLocalSavedFatwas() {
  const [savedFatwas, setSavedFatwas] = useState([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setSavedFatwas(parsed)
        }
      }
    } catch {
      // Corrupted data — reset
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Persist to localStorage whenever savedFatwas changes
  const persist = useCallback((items) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage full or unavailable — silently fail
    }
  }, [])

  /**
   * Save a fatwa. Stores only essential fields to keep storage lean.
   */
  const saveFatwa = useCallback((fatwa) => {
    setSavedFatwas(prev => {
      // Don't duplicate
      if (prev.some(f => f.id === fatwa.id)) return prev

      const compact = {
        id: fatwa.id,
        title: fatwa.title || fatwa.question_text?.slice(0, 100) || 'Untitled',
        slug: fatwa.slug || null,
        category_1: fatwa.category_1 || null,
        category_2: fatwa.category_2 || null,
        dar_ul_ifta: fatwa.dar_ul_ifta || null,
        saved_at: new Date().toISOString(),
      }

      const next = [compact, ...prev]
      persist(next)
      return next
    })
  }, [persist])

  /**
   * Remove a saved fatwa by ID.
   */
  const removeFatwa = useCallback((fatwaId) => {
    setSavedFatwas(prev => {
      const next = prev.filter(f => f.id !== fatwaId)
      persist(next)
      return next
    })
  }, [persist])

  /**
   * Toggle save/unsave.
   */
  const toggleSave = useCallback((fatwa) => {
    if (savedFatwas.some(f => f.id === fatwa.id)) {
      removeFatwa(fatwa.id)
    } else {
      saveFatwa(fatwa)
    }
  }, [savedFatwas, saveFatwa, removeFatwa])

  /**
   * Check if a fatwa is saved.
   */
  const isSaved = useCallback((fatwaId) => {
    return savedFatwas.some(f => f.id === fatwaId)
  }, [savedFatwas])

  /**
   * Clear all saved fatwas.
   */
  const clearAll = useCallback(() => {
    setSavedFatwas([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    savedFatwas,
    saveFatwa,
    removeFatwa,
    toggleSave,
    isSaved,
    clearAll,
    count: savedFatwas.length,
  }
}
