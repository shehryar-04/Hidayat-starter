import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

import { isAuthBypassEnabled, DEV_ADMIN_USER, DEV_ADMIN_SESSION } from '../config/authBypass'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables. ' +
    'Copy .env.example to .env.local and fill in your Supabase project credentials.',
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Wrap auth.getUser and auth.getSession to support testing bypass mode without throwing
const originalGetUser = supabase.auth.getUser.bind(supabase.auth)
const originalGetSession = supabase.auth.getSession.bind(supabase.auth)

supabase.auth.getUser = async (...args) => {
  try {
    const res = await originalGetUser(...args)
    if (res?.data?.user) return res
    if (isAuthBypassEnabled()) {
      return { data: { user: DEV_ADMIN_USER }, error: null }
    }
    return res
  } catch (err) {
    if (isAuthBypassEnabled()) {
      return { data: { user: DEV_ADMIN_USER }, error: null }
    }
    throw err
  }
}

supabase.auth.getSession = async (...args) => {
  try {
    const res = await originalGetSession(...args)
    if (res?.data?.session) return res
    if (isAuthBypassEnabled()) {
      return { data: { session: DEV_ADMIN_SESSION }, error: null }
    }
    return res
  } catch (err) {
    if (isAuthBypassEnabled()) {
      return { data: { session: DEV_ADMIN_SESSION }, error: null }
    }
    throw err
  }
}

