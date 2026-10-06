import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { isAuthBypassEnabled, DEV_ADMIN_USER, setAuthBypass } from '../config/authBypass'

const RoleContext = createContext({
  role: null,
  userId: null,
  loading: true,
  signOut: async () => {},
  isBypassActive: false,
  toggleBypass: () => {},
})

export function RoleProvider({ children }) {
  const [bypass, setBypass] = useState(isAuthBypassEnabled)
  const [role, setRole] = useState(() => (isAuthBypassEnabled() ? 'admin' : null))
  const [userId, setUserId] = useState(() => (isAuthBypassEnabled() ? DEV_ADMIN_USER.id : null))
  const [loading, setLoading] = useState(() => (isAuthBypassEnabled() ? false : true))
  const [initialized, setInitialized] = useState(() => (isAuthBypassEnabled() ? true : false))

  const loadRole = useCallback(async (uid, showLoading = false) => {
    if (showLoading) setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .single()
    setRole(data?.role ?? null)
    setUserId(uid)
    setLoading(false)
    setInitialized(true)
  }, [])

  // Listen for testing bypass toggle changes
  useEffect(() => {
    const handleBypassChange = () => {
      const active = isAuthBypassEnabled()
      setBypass(active)
      if (active) {
        setRole('admin')
        setUserId(DEV_ADMIN_USER.id)
        setLoading(false)
        setInitialized(true)
      } else {
        setLoading(true)
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            loadRole(session.user.id, true)
          } else {
            setRole(null)
            setUserId(null)
            setLoading(false)
            setInitialized(true)
          }
        })
      }
    }

    window.addEventListener('auth_bypass_changed', handleBypassChange)
    return () => window.removeEventListener('auth_bypass_changed', handleBypassChange)
  }, [loadRole])

  // Normal Supabase session and auth listener
  useEffect(() => {
    if (bypass) {
      setRole('admin')
      setUserId(DEV_ADMIN_USER.id)
      setLoading(false)
      setInitialized(true)
      return
    }

    // Load role from current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadRole(session.user.id, true)
      } else {
        setLoading(false)
        setInitialized(true)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isAuthBypassEnabled()) return

      if (event === 'SIGNED_OUT') {
        setRole(null)
        setUserId(null)
        setLoading(false)
        return
      }
      if (session?.user) {
        // On token refresh or re-auth, reload role silently (no loading state)
        loadRole(session.user.id, !initialized)
      }
    })

    return () => subscription.unsubscribe()
  }, [bypass, initialized, loadRole])

  async function signOut() {
    await supabase.auth.signOut()
    if (!isAuthBypassEnabled()) {
      setRole(null)
      setUserId(null)
    }
  }

  const toggleBypass = (enabled) => {
    const nextVal = typeof enabled === 'boolean' ? enabled : !bypass
    setAuthBypass(nextVal)
  }

  return (
    <RoleContext.Provider value={{ role, userId, loading, signOut, isBypassActive: bypass, toggleBypass }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}

