import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, LogIn, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useRole } from './RoleProvider'

/**
 * SessionGuard — Monitors JWT expiry and user activity.
 *
 * Behavior:
 * 1. Parses JWT `exp` from the current session.
 * 2. 5 minutes before expiry: attempts a silent refresh.
 * 3. If refresh succeeds: resets timer, user notices nothing.
 * 4. If refresh fails OR user was idle >30 min: shows "Session Expired" modal.
 * 5. Modal has "Log In Again" button that preserves the current URL.
 *
 * Only active when the user is authenticated (role is set).
 */
const WARN_BEFORE_MS = 5 * 60 * 1000  // 5 minutes before expiry
const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes idle = show expired

export default function SessionGuard() {
  const { role, signOut } = useRole()
  const [expired, setExpired] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const refreshTimerRef = useRef(null)
  const idleTimerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  // Track user activity
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!role) return // Only guard authenticated users

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }))
    return () => events.forEach(e => window.removeEventListener(e, resetActivity))
  }, [role, resetActivity])

  // Schedule refresh before token expires
  const scheduleRefresh = useCallback(async () => {
    clearTimeout(refreshTimerRef.current)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Parse expiry from the access token
    const exp = session.expires_at // Supabase provides this as unix timestamp (seconds)
    if (!exp) return

    const expiresAtMs = exp * 1000
    const now = Date.now()
    const msUntilExpiry = expiresAtMs - now

    if (msUntilExpiry <= 0) {
      // Already expired
      handleExpired()
      return
    }

    // Schedule refresh attempt WARN_BEFORE_MS before expiry
    const refreshIn = Math.max(0, msUntilExpiry - WARN_BEFORE_MS)

    refreshTimerRef.current = setTimeout(async () => {
      // Check if user has been idle too long
      const idleMs = Date.now() - lastActivityRef.current
      if (idleMs > IDLE_TIMEOUT_MS) {
        handleExpired()
        return
      }

      // Attempt silent refresh
      setRefreshing(true)
      const { error } = await supabase.auth.refreshSession()
      setRefreshing(false)

      if (error) {
        handleExpired()
      } else {
        // Refresh succeeded — schedule next one
        scheduleRefresh()
      }
    }, refreshIn)
  }, [])

  const handleExpired = useCallback(() => {
    setExpired(true)
  }, [])

  // Start monitoring when authenticated
  useEffect(() => {
    if (role) {
      scheduleRefresh()

      // Also listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setExpired(false)
          scheduleRefresh()
        }
        if (event === 'SIGNED_OUT') {
          clearTimeout(refreshTimerRef.current)
          setExpired(false)
        }
      })

      return () => {
        clearTimeout(refreshTimerRef.current)
        subscription.unsubscribe()
      }
    }
  }, [role, scheduleRefresh])

  // Check idle state periodically
  useEffect(() => {
    if (!role) return

    idleTimerRef.current = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current
      if (idleMs > IDLE_TIMEOUT_MS) {
        handleExpired()
      }
    }, 60000) // Check every minute

    return () => clearInterval(idleTimerRef.current)
  }, [role, handleExpired])

  const handleLoginAgain = () => {
    // Preserve the current URL so user returns here after login
    const returnTo = window.location.pathname + window.location.search
    signOut().then(() => {
      window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
    })
  }

  const handleTryRefresh = async () => {
    setRefreshing(true)
    const { error } = await supabase.auth.refreshSession()
    setRefreshing(false)

    if (!error) {
      setExpired(false)
      scheduleRefresh()
    }
  }

  if (!role || !expired) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Session Expired
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your session has expired due to inactivity. Please log in again to continue where you left off.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleTryRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Reconnecting...' : 'Try to Reconnect'}
            </button>
            <button
              onClick={handleLoginAgain}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Log In Again
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Your unsaved work on this page will be preserved.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
