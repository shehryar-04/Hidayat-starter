import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
