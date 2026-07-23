import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button, Input, Label, cn } from '../shared/ui'

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
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Where to redirect after login (from session guard or deep link)
  const returnTo = searchParams.get('returnTo') || '/short-courses'

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(signInError.message)
      else navigate(returnTo)
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

  async function handleGoogleSignIn() {
    setError(null)
    setGoogleLoading(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${returnTo}`,
        },
      })
      if (oauthError) setError(oauthError.message)
      // If no error, Supabase redirects the browser to Google
    } catch (err) {
      setError('Failed to initiate Google sign-in. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Institution Name */}
        <div className="text-center mb-8">
          <img
            src="/assets/LOGO_HIDAYAT.png"
            alt="Hidayat"
            className="w-16 h-16 mx-auto mb-3 object-contain"
          />
          <h1 className="font-display text-[28px] font-semibold text-neutral-900">
            Hidayat
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Learning Today, Leading Tomorrow</p>
        </div>

        {/* Card with fade-up entrance */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
          className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="pl-9 min-h-[44px]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="pl-9 min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                  className="pl-9 min-h-[44px]"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                    className="pl-9 min-h-[44px]"
                  />
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-error-light text-error-dark rounded-lg p-4 text-sm" role="alert">
                {error}
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="bg-success-light text-success-dark rounded-lg p-4 text-sm" role="alert">
                {success}
              </div>
            )}

            {/* Resend verification email section */}
            {showResendVerification && (
              <div className="bg-info-light border border-info/20 rounded-lg p-4 space-y-3">
                <p className="text-sm text-info-dark">
                  Didn't receive the verification email? Check your spam folder or resend it.
                </p>
                <Button
                  type="button"
                  onClick={handleResendVerification}
                  loading={resending}
                  variant="primary"
                  size="md"
                  className="w-full min-h-[44px]"
                >
                  Resend Verification Email
                </Button>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              variant="primary"
              size="md"
              className="w-full min-h-[44px]"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-neutral-400">or</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 min-h-[44px] px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
            <p className="text-sm text-neutral-500 mb-3">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <Button
              onClick={switchMode}
              variant="outline"
              size="md"
              className="w-full min-h-[44px]"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </Button>

            {/* Resend verification link on sign-in side */}
            {!isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setShowResendVerification(true)
                  setResendEmail(email)
                }}
                className="mt-3 text-sm text-primary-500 hover:text-primary-700 underline underline-offset-2 min-h-[44px] inline-flex items-center"
              >
                Didn't get verification email?
              </button>
            )}

            {/* Resend verification panel (shown on sign-in side) */}
            {!isSignUp && showResendVerification && !success && (
              <div className="mt-4 bg-info-light border border-info/20 rounded-lg p-4 space-y-3 text-left">
                <Label className="text-sm text-info-dark">Enter your email to resend verification</Label>
                <Input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="min-h-[44px]"
                />
                <Button
                  type="button"
                  onClick={handleResendVerification}
                  loading={resending}
                  variant="primary"
                  size="md"
                  className="w-full min-h-[44px]"
                >
                  Resend Verification Email
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
