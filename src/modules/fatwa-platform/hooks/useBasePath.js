import { useLocation } from 'react-router-dom'

/**
 * Returns the base path for the fatwa platform module.
 * Detects whether we're mounted at /fatwas or /darul-iftaa or /darul-ifta
 * and returns the correct base for building internal links.
 *
 * @returns {string} The base path (e.g., "/fatwas", "/darul-iftaa", or "/darul-ifta")
 */
export function useBasePath() {
  const { pathname } = useLocation()

  if (pathname.startsWith('/darul-iftaa')) {
    return '/darul-iftaa'
  }

  if (pathname.startsWith('/darul-ifta')) {
    return '/darul-ifta'
  }

  return '/fatwas'
}
