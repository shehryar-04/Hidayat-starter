import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const RoleContext = createContext({
  role: null,
  userId: null,
  loading: true,
  signOut: async () => {},
})

export function RoleProvider({ children }) {
  const [role, setRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
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
      if (event === 'SIGNED_OUT') {
        setRole(null)
        setUserId(null)
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
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .single()
    setRole(data?.role ?? null)
    setUserId(uid)
    setLoading(false)
    setInitialized(true)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setRole(null)
    setUserId(null)
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
