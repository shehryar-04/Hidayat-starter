import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Logo from './Logo'

/**
 * /auth/callback — Landing page for email verification links.
 *
 * Self-hosted confirmation supports two flows:
 *
 * 1. Custom template (preferred):
 *    https://hidayat.pk/auth/callback?token_hash=...&type=signup
 *    The page calls verifyOtp(), which confirms the email and returns a session.
 *
 * 2. GoTrue's default ConfirmationURL (backward compatibility):
 *    https://supabase.hidayat.pk/auth/v1/verify?...&redirect_to=<callback>
 *    GoTrue verifies first, then redirects here with session tokens in the hash.
 *docker logs supabase-auth --tail 100

 * The custom template keeps the user-facing email link on the frontend domain
 * and avoids relying on a post-verification browser redirect.
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
      // GoTrue can report failures in either the query string or hash fragment.
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const errorParam = searchParams.get('error') || hashParams.get('error')
      const errorDescription =
        searchParams.get('error_description') || hashParams.get('error_description')

      if (errorParam) {
        setStatus('error')
        setErrorMessage(errorDescription || errorParam || 'Verification failed.')
        return
      }

      // Check if the current action is a password recovery flow
      const requestedType = searchParams.get('type') || hashParams.get('type') || 'signup'
      const isRecovery = requestedType === 'recovery'
      const redirectUrl = isRecovery ? '/reset-password' : '/'

      // Custom self-hosted email template flow. The email lands directly on
      // this frontend route and supplies GoTrue's hashed one-time token. Calling
      // verifyOtp confirms the email and stores the returned session locally.
      const tokenHash = searchParams.get('token_hash')
      if (tokenHash) {
        const supportedTypes = new Set([
          'signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email',
        ])
        const type = supportedTypes.has(requestedType) ? requestedType : 'signup'
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

        // Remove the one-time token from browser history as soon as it is used.
        window.history.replaceState({}, document.title, '/auth/callback')

        if (error || !data?.session) {
          setStatus('error')
          setErrorMessage(error?.message || 'Could not verify your email. The link may have expired.')
          return
        }

        setStatus('success')
        setTimeout(() => navigate(redirectUrl, { replace: true }), 2500)
        return
      }

      // Compatibility with GoTrue's default ConfirmationURL flow. Supabase-js
      // automatically consumes access/refresh tokens from the URL hash.
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Could not verify your email. The link may have expired.')
        return
      }

      if (data?.session) {
        setStatus('success')
        setTimeout(() => navigate(redirectUrl, { replace: true }), 2500)
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setStatus('success')
            setTimeout(() => navigate(redirectUrl, { replace: true }), 2500)
            subscription.unsubscribe()
          }
        })

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
    } catch {
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
