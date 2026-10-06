/**
 * Auth & Authorization Testing Bypass Configuration
 *
 * When enabled (default: true):
 * - Every incoming visitor behaves as an Administrator ('admin' role)
 * - Login is not required to interact with any page or module
 * - Protected routes, feature flags, and admin navigation are fully accessible
 *
 * Toggle methods:
 * 1. Runtime / testing toggle:
 *    call window.setAuthBypass(true / false) or toggle via UI
 * 2. Local storage:
 *    localStorage.setItem('DEV_BYPASS_AUTH', 'true' / 'false')
 * 3. Environment variable:
 *    VITE_BYPASS_AUTH=true / false
 */

export const DEV_ADMIN_USER = {
  id: 'a0000000-0000-0000-0000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'admin@hidayat.local',
  app_metadata: { role: 'admin' },
  user_metadata: { full_name: 'Administrator', role: 'admin' },
  created_at: '2026-01-01T00:00:00.000Z',
}

export const DEV_ADMIN_PROFILE = {
  id: 'a0000000-0000-0000-0000-000000000001',
  role: 'admin',
  full_name: 'Administrator (Testing Mode)',
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@hidayat.local',
  avatar_url: null,
}

export const DEV_ADMIN_SESSION = {
  access_token: 'dev-bypass-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: 'dev-bypass-refresh-token',
  user: DEV_ADMIN_USER,
}

/**
 * Returns true if the testing auth bypass is active.
 * Defaults to true for open testing unless explicitly disabled.
 */
export const isAuthBypassEnabled = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('DEV_BYPASS_AUTH')
      if (stored !== null && stored !== undefined) {
        return stored === 'true'
      }
    }
  } catch {}

  // Environment variable override
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BYPASS_AUTH !== undefined) {
    return import.meta.env.VITE_BYPASS_AUTH === 'true'
  }

  // Under automated testing runner (Vitest/Jest), default to false to let unit tests verify authentic flows
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
    return false
  }

  // Default: true (unplugged for unrestricted exploration and admin interaction)
  return true
}

/**
 * Enables or disables the auth bypass at runtime.
 * Dispatches an 'auth_bypass_changed' window event so components reactively update.
 */
export const setAuthBypass = (enabled) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('DEV_BYPASS_AUTH', String(enabled))
      window.dispatchEvent(new CustomEvent('auth_bypass_changed', { detail: { enabled } }))
    }
  } catch {}
}

// Expose on window for easy browser console testing
if (typeof window !== 'undefined') {
  window.isAuthBypassEnabled = isAuthBypassEnabled
  window.setAuthBypass = setAuthBypass
}
