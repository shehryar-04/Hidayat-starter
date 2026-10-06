import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { isAuthBypassEnabled } from '../config/authBypass'

const defaultFlags = {
  dars_e_nizami: false,
  hifz: false,
  nazra: false,
  short_courses: false,
  darul_ifta: false,
  research_center: false,
  wazifa: false,
  student_reports: false,
}

const allEnabledFlags = {
  dars_e_nizami: true,
  hifz: true,
  nazra: true,
  short_courses: true,
  darul_ifta: true,
  research_center: true,
  wazifa: true,
  student_reports: true,
}

const FeatureFlagContext = createContext({
  flags: defaultFlags,
  loading: true,
})

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState(() => (isAuthBypassEnabled() ? allEnabledFlags : defaultFlags))
  const [loading, setLoading] = useState(() => (isAuthBypassEnabled() ? false : true))
  const initializedRef = { current: false }

  const fetchFlags = async (showLoading = false) => {
    if (isAuthBypassEnabled()) {
      setFlags(allEnabledFlags)
      setLoading(false)
      initializedRef.current = true
      return
    }

    if (showLoading) setLoading(true)

    const { data } = await supabase
      .from('feature_flags')
      .select('module, enabled')

    if (data) {
      const mapped = data.reduce((acc, row) => {
        acc[row.module] = row.enabled
        return acc
      }, {})
      setFlags((prev) => ({ ...prev, ...mapped }))
    }
    setLoading(false)
    initializedRef.current = true
  }

  useEffect(() => {
    // Initial fetch — show loading only the first time
    fetchFlags(true)

    const handleBypassChange = () => {
      fetchFlags(false)
    }
    window.addEventListener('auth_bypass_changed', handleBypassChange)

    // Re-fetch when auth state changes (login/logout) — silently
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only refetch silently after initial load
      if (initializedRef.current) {
        fetchFlags(false)
      }
    })

    // Realtime subscription for live updates
    const channel = supabase
      .channel('feature_flags_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags' },
        (payload) => {
          const row = payload.new
          if (row?.module) {
            setFlags((prev) => ({
              ...prev,
              [row.module]: row.enabled,
            }))
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <FeatureFlagContext.Provider value={{ flags, loading }}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext)
}
