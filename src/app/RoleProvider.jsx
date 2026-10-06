import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Testing Auth Switch ──────────────────────────────────────────────
// Set to false to re-enable required login in production
const UNPLUG_LOGIN_FOR_TESTING = true

const TEST_USERS = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'admin',
  },
  student: {
    id: '00000000-0000-0000-0000-000000000002',
    role: 'student',
  },
}

function getStoredTestRole() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('hidayat_test_role')
      if (stored && TEST_USERS[stored]) {
        return stored
      }
    } catch {
      // ignore
    }
  }
  return 'admin'
}

const defaultTestRole = UNPLUG_LOGIN_FOR_TESTING ? getStoredTestRole() : null
const defaultTestUser = defaultTestRole ? TEST_USERS[defaultTestRole] : null

const RoleContext = createContext({
  role: defaultTestRole,
  userId: defaultTestUser?.id || null,
  loading: false,
  signOut: async () => {},
  switchRole: () => {},
  isTestingMode: UNPLUG_LOGIN_FOR_TESTING,
})

export function RoleProvider({ children }) {
  const [role, setRole] = useState(defaultTestRole)
  const [userId, setUserId] = useState(defaultTestUser?.id || null)
  const [loading, setLoading] = useState(UNPLUG_LOGIN_FOR_TESTING ? false : true)
  const [initialized, setInitialized] = useState(UNPLUG_LOGIN_FOR_TESTING)

  const switchRole = useCallback((newRole) => {
    if (UNPLUG_LOGIN_FOR_TESTING) {
      const targetRole = TEST_USERS[newRole] ? newRole : 'student'
      try {
        localStorage.setItem('hidayat_test_role', targetRole)
      } catch {
        // ignore
      }
      setRole(targetRole)
      setUserId(TEST_USERS[targetRole].id)
    }
  }, [])

  useEffect(() => {
    // Load role from current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadRole(session.user.id, true)
      } else {
        if (UNPLUG_LOGIN_FOR_TESTING) {
          const currentRole = getStoredTestRole()
          setRole(currentRole)
          setUserId(TEST_USERS[currentRole]?.id || TEST_USERS.admin.id)
        }
        setLoading(false)
        setInitialized(true)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (UNPLUG_LOGIN_FOR_TESTING) {
          const currentRole = getStoredTestRole()
          setRole(currentRole)
          setUserId(TEST_USERS[currentRole]?.id || TEST_USERS.admin.id)
        } else {
          setRole(null)
          setUserId(null)
        }
        setLoading(false)
        return
      }
      if (session?.user) {
        // On token refresh or re-auth, reload role silently
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
      if (data?.role) {
        setRole(data.role)
        setUserId(uid)
      } else if (UNPLUG_LOGIN_FOR_TESTING) {
        const currentRole = getStoredTestRole()
        setRole(currentRole)
        setUserId(uid || TEST_USERS[currentRole]?.id || TEST_USERS.admin.id)
      } else {
        setRole(null)
        setUserId(uid)
      }
    } catch {
      if (UNPLUG_LOGIN_FOR_TESTING) {
        const currentRole = getStoredTestRole()
        setRole(currentRole)
        setUserId(uid || TEST_USERS[currentRole]?.id || TEST_USERS.admin.id)
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
    <RoleContext.Provider value={{ role, userId, loading, signOut, switchRole, isTestingMode: UNPLUG_LOGIN_FOR_TESTING }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
