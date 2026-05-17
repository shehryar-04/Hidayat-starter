// Client-side helper for incrementing fatwa view count
// Uses sessionStorage to prevent duplicate counts per session
// Requirement: 10.4

const SESSION_STORAGE_KEY = 'hidayat_viewed_fatwas'

/**
 * Get the set of fatwa IDs already viewed in this session.
 * @returns {Set<string>}
 */
function getViewedFatwas() {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return new Set()
    return new Set(JSON.parse(stored))
  } catch {
    return new Set()
  }
}

/**
 * Mark a fatwa as viewed in sessionStorage.
 * @param {string} fatwaId
 */
function markAsViewed(fatwaId) {
  try {
    const viewed = getViewedFatwas()
    viewed.add(fatwaId)
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify([...viewed]))
  } catch {
    // sessionStorage unavailable (e.g., private browsing quota exceeded) — skip
  }
}

/**
 * Increment the view count for a fatwa.
 * Checks sessionStorage to prevent duplicate increments within the same session.
 * Silently fails on errors — view counting is non-critical.
 *
 * @param {string} fatwaId - The UUID of the fatwa to increment
 * @returns {Promise<void>}
 */
export async function incrementFatwaView(fatwaId) {
  if (!fatwaId) return

  // Check if already viewed in this session
  const viewed = getViewedFatwas()
  if (viewed.has(fatwaId)) return

  // Mark as viewed immediately to prevent race conditions
  markAsViewed(fatwaId)

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) return

    const response = await fetch(`${supabaseUrl}/functions/v1/increment-fatwa-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fatwa_id: fatwaId }),
    })

    // Silently handle failures — non-critical operation
    if (!response.ok) return

    const data = await response.json()
    return data.success
  } catch {
    // Network error or other failure — silently fail
    // View count increment is non-critical, no user impact
  }
}
