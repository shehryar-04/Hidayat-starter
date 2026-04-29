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

  useEffect(() => {
    // Load role from current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadRole(session.user.id)
      } else {
        setRole(null)
        setUserId(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadRole(uid) {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .single()
    setRole(data?.role ?? null)
    setUserId(uid)
    setLoading(false)
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
