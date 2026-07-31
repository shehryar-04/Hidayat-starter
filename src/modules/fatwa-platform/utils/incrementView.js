// Client-side helper for incrementing fatwa view count.
// Uses sessionStorage to prevent duplicate counts per browser session.

import { FUNCTIONS_BASE_URL } from '../../../lib/env'

const SESSION_STORAGE_KEY = 'hidayat_viewed_fatwas'
const inFlight = new Set()

function getViewedFatwas() {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function markAsViewed(fatwaId) {
  try {
    const viewed = getViewedFatwas()
    viewed.add(fatwaId)
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify([...viewed]))
  } catch {
    // Storage may be unavailable; the server increment still succeeded.
  }
}

/**
 * Increment a published fatwa's view count once per browser session.
 * Failed requests remain retryable and concurrent calls are coalesced.
 *
 * @param {string|number} fatwaId - Numeric public.fatwas ID
 * @returns {Promise<boolean>}
 */
export async function incrementFatwaView(fatwaId) {
  const id = String(fatwaId || '').trim()
  if (!/^[1-9]\d*$/.test(id) || getViewedFatwas().has(id) || inFlight.has(id)) {
    return false
  }

  if (!FUNCTIONS_BASE_URL) return false

  inFlight.add(id)
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/increment-fatwa-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fatwa_id: id }),
    })
    if (!response.ok) return false

    const data = await response.json()
    if (data.success === true) {
      markAsViewed(id)
      return true
    }
    return false
  } catch {
    return false
  } finally {
    inFlight.delete(id)
  }
}
