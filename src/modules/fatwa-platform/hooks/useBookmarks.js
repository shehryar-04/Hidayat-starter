import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

/**
 * useBookmarks — Hook for managing user fatwa bookmarks.
 * Returns bookmarked fatwa IDs set and toggle/load functions.
 */
export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(false)

  const loadBookmarks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)
    const { data } = await supabase
      .from('user_bookmarks')
      .select('fatwa_id, created_at, fatwas(id, title, slug, category_1, category_2, dar_ul_ifta, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const items = data || []
    setBookmarks(items)
    setBookmarkedIds(new Set(items.map(b => b.fatwa_id)))
    setLoading(false)
  }, [])

  useEffect(() => { loadBookmarks() }, [loadBookmarks])

  const toggleBookmark = useCallback(async (fatwaId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isBookmarked = bookmarkedIds.has(fatwaId)

    if (isBookmarked) {
      await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('fatwa_id', fatwaId)

      setBookmarkedIds(prev => {
        const next = new Set(prev)
        next.delete(fatwaId)
        return next
      })
      setBookmarks(prev => prev.filter(b => b.fatwa_id !== fatwaId))
    } else {
      await supabase
        .from('user_bookmarks')
        .insert({ user_id: user.id, fatwa_id: fatwaId })

      setBookmarkedIds(prev => new Set([...prev, fatwaId]))
      // Reload to get full fatwa data
      loadBookmarks()
    }
  }, [bookmarkedIds, loadBookmarks])

  const isBookmarked = useCallback((fatwaId) => bookmarkedIds.has(fatwaId), [bookmarkedIds])

  return { bookmarks, bookmarkedIds, loading, toggleBookmark, isBookmarked, reload: loadBookmarks }
}
