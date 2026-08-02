import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Logo from './Logo'

/**
 * /auth/callback — Landing page for email verification links.
 *
 * With self-hosted Supabase the confirmation email contains a link like:
 *   https://supabase.hidayat.pk/auth/v1/verify?token=...&type=signup&redirect_to=<SITE_URL>/auth/callback
 *
 * After Supabase verifies the token server-side, it redirects the browser to:
 *   <SITE_URL>/auth/callback#access_token=...&refresh_token=...&type=signup
 *
 * This page:
 * 1. Lets the Supabase JS client exchange the hash-fragment tokens for a session.
 * 2. Shows a success state and redirects to the dashboard after a brief pause.
 * 3. If something goes wrong, shows an error with a retry option.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('processing') // processing | success | error
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    handleAuthCallback()
  }, [])

  async function handleAuthCallback() {
    try {
      // Check for error params (Supabase sometimes puts errors in query string)
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        setStatus('error')
        setErrorMessage(errorDescription || errorParam || 'Verification failed.')
        return
      }

      // The hash fragment (access_token, refresh_token) is automatically picked up
      // by supabase-js when it initializes. We just need to get the session.
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Could not verify your email. The link may have expired.')
        return
      }

      if (data?.session) {
        setStatus('success')
        // Give the user a moment to see the success message, then redirect
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 2500)
      } else {
        // No session yet — could be the hash hasn't been consumed yet.
        // Listen for the auth state to change.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setStatus('success')
            setTimeout(() => {
              navigate('/', { replace: true })
            }, 2500)
            subscription.unsubscribe()
          }
        })

        // Set a timeout so we don't wait forever
        setTimeout(() => {
          subscription.unsubscribe()
          setStatus((prev) => {
            if (prev === 'processing') {
              setErrorMessage('Verification timed out. The link may have expired or already been used.')
              return 'error'
            }
            return prev
          })
        }, 10000)
      }
    } catch (err) {
      setStatus('error')
      setErrorMessage('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" className="mb-8 mx-auto" />

        {status === 'processing' && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 space-y-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
            <h1 className="font-display font-bold text-xl text-neutral-900">
              Verifying your email…
            </h1>
            <p className="text-sm text-neutral-500">
              Please wait while we confirm your account.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9 text-success" />
            </div>
            <h1 className="font-display font-bold text-xl text-neutral-900">
              Email verified!
            </h1>
            <p className="text-sm text-neutral-500">
              Your account has been confirmed. Redirecting you to the dashboard…
            </p>
            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-primary-500 rounded-full animate-[grow_2.5s_ease-in-out]" style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9 text-error" />
            </div>
            <h1 className="font-display font-bold text-xl text-neutral-900">
              Verification failed
            </h1>
            <p className="text-sm text-neutral-500">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/login', { replace: true, state: { showResend: true } })}
                className="w-full rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                Resend verification email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
