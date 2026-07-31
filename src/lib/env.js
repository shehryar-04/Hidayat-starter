/**
 * Centralised, sanitised access to Vite environment variables.
 *
 * Why this exists:
 * Values injected via `.env` files (or a hosting provider's env var UI) can pick
 * up stray whitespace — most commonly a trailing newline when a value is pasted
 * into a textarea or written with `echo`. Vite embeds the value verbatim at build
 * time, so that newline ends up inside request URLs and headers. A trailing "\n"
 * in the anon key, for example, becomes `?apikey=eyJ...%0A` on the Realtime
 * WebSocket URL and can cause auth failures.
 *
 * Every consumer should import from here instead of reading `import.meta.env`
 * directly so sanitisation is guaranteed to happen exactly once, in one place.
 */

/** Trim surrounding whitespace (incl. \r and \n) from an env value. */
function cleanEnv(value) {
  return typeof value === 'string' ? value.trim() : value
}

/** Trim, then drop any trailing slashes so URL joining stays predictable. */
function cleanUrl(value) {
  const trimmed = cleanEnv(value)
  return typeof trimmed === 'string' ? trimmed.replace(/\/+$/, '') : trimmed
}

export const SUPABASE_URL = cleanUrl(import.meta.env.VITE_SUPABASE_URL)
export const SUPABASE_ANON_KEY = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)
export const GA_ID = cleanEnv(import.meta.env.VITE_GA_ID)
export const CLARITY_ID = cleanEnv(import.meta.env.VITE_CLARITY_ID)

/** Base URL for Supabase Edge Functions, e.g. `<base>/functions/v1`. */
export const FUNCTIONS_BASE_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : ''
