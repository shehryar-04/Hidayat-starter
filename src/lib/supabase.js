import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

// Safe default values for testing without active environment credentials
const defaultUrl = 'https://supabase.hidayat.pk'
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key'

const effectiveUrl = SUPABASE_URL || defaultUrl
const effectiveKey = SUPABASE_ANON_KEY || defaultKey

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. Using test fallback.'
  )
}

export const supabase = createClient(effectiveUrl, effectiveKey)
