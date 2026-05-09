import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(signInError.message)
      else navigate('/short-courses')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!fullName.trim()) { setError('Full name is required'); return }
    setLoading(true)
    try {
      // Use the rate-limited signup Edge Function instead of direct auth.signUp
      // This enforces server-side rate limiting and hardcodes role to 'student'
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed. Please try again.')
        return
      }

      setSuccess(data.message || 'Account created! Please check your email to confirm your account.')
      setResendEmail(email)
      setEmail(''); setPassword(''); setConfirmPassword(''); setFullName('')
      setShowResendVerification(true)
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsSignUp(!isSignUp)
    setError(null); setSuccess(null)
    setShowResendVerification(false)
    setEmail(''); setPassword(''); setConfirmPassword(''); setFullName('')
  }

  async function handleResendVerification() {
    setError(null)
    setSuccess(null)
    const targetEmail = resendEmail || email
    if (!targetEmail) { setError('Please enter your email address.'); return }
    setResending(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ email: targetEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to resend verification email.')
      } else {
        setSuccess(data.message || 'Verification email sent! Check your inbox and spam folder.')
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/assets/LOGO_HIDAYAT.png" alt="HIDAYAT" className="w-16 h-16 mx-auto mb-3 object-contain" />
          <h1 className="text-3xl font-bold text-primary">Hidayat</h1>
          <p className="text-gray-500 text-sm mt-1">Learning Today, Leading Tomorrow</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                className="form-input"
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className="form-input"
                />
              </div>
            )}

            {error && <div className="alert-error text-sm">{error}</div>}
            {success && <div className="alert-success text-sm">{success}</div>}

            {/* Resend verification email section */}
            {showResendVerification && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-sm text-blue-800">
                  Didn't receive the verification email? Check your spam folder or resend it.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {resending ? 'Sending…' : 'Resend Verification Email'}
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? (isSignUp ? 'Creating account…' : 'Signing in…')
                : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-3">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button onClick={switchMode} className="btn-outline w-full">
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>

            {/* Resend verification link on sign-in side */}
            {!isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setShowResendVerification(true)
                  setResendEmail(email)
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2"
              >
                Didn't get verification email?
              </button>
            )}

            {/* Resend verification panel (shown on sign-in side) */}
            {!isSignUp && showResendVerification && !success && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 text-left">
                <label className="form-label text-sm text-blue-800">Enter your email to resend verification</label>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="form-input text-sm"
                />
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {resending ? 'Sending…' : 'Resend Verification Email'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
