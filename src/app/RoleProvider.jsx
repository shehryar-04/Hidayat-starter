import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ─── Testing Auth Switch ──────────────────────────────────────────────
// Set to false to re-enable required login in production
const UNPLUG_LOGIN_FOR_TESTING = true

const TEST_ADMIN_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  role: 'admin',
}

const RoleContext = createContext({
  role: UNPLUG_LOGIN_FOR_TESTING ? TEST_ADMIN_USER.role : null,
  userId: UNPLUG_LOGIN_FOR_TESTING ? TEST_ADMIN_USER.id : null,
  loading: false,
  signOut: async () => {},
})

export function RoleProvider({ children }) {
  const [role, setRole] = useState(UNPLUG_LOGIN_FOR_TESTING ? TEST_ADMIN_USER.role : null)
  const [userId, setUserId] = useState(UNPLUG_LOGIN_FOR_TESTING ? TEST_ADMIN_USER.id : null)
  const [loading, setLoading] = useState(UNPLUG_LOGIN_FOR_TESTING ? false : true)
  const [initialized, setInitialized] = useState(UNPLUG_LOGIN_FOR_TESTING)

  useEffect(() => {
    // Load role from current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadRole(session.user.id, true)
      } else {
        if (UNPLUG_LOGIN_FOR_TESTING) {
          setRole(TEST_ADMIN_USER.role)
          setUserId(TEST_ADMIN_USER.id)
        }
        setLoading(false)
        setInitialized(true)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (UNPLUG_LOGIN_FOR_TESTING) {
          setRole(TEST_ADMIN_USER.role)
          setUserId(TEST_ADMIN_USER.id)
        } else {
          setRole(null)
          setUserId(null)
        }
        setLoading(false)
        return
      }
      if (session?.user) {
        // On token refresh or re-auth, reload role silently (no loading state)
        // This prevents the entire app from unmounting/remounting
        loadRole(session.user.id, !initialized)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadRole(uid, showLoading = false) {
    if (showLoading) setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .single()
      setRole(data?.role ?? (UNPLUG_LOGIN_FOR_TESTING ? TEST_ADMIN_USER.role : null))
      setUserId(uid)
    } catch {
      if (UNPLUG_LOGIN_FOR_TESTING) {
        setRole(TEST_ADMIN_USER.role)
        setUserId(uid || TEST_ADMIN_USER.id)
      }
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    if (!UNPLUG_LOGIN_FOR_TESTING) {
      setRole(null)
      setUserId(null)
    }
  }

  return (
    <RoleContext.Provider value={{ role, userId, loading, signOut }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
