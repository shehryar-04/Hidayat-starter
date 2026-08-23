import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button, Input, Label } from '../shared/ui'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()

  async function handlePasswordUpdate(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess('Password updated successfully! Redirecting you to login...')
        setPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2500)
      }
    } catch (err) {
      setError('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
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
            Reset Your Password
          </h2>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
              Please enter your new password below.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  className="pl-9 min-h-[44px]"
                />
              </div>
            </div>

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

            <Button
              type="submit"
              loading={loading}
              variant="primary"
              size="md"
              className="w-full min-h-[44px]"
            >
              Update Password
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
