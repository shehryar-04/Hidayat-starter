import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button, Input, Label, PageWrapper, PageHeader } from '../shared/ui'

/** Simple password-strength scorer (0–4) */
function scorePassword(pwd) {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = [
  'bg-neutral-200',
  'bg-red-400',
  'bg-orange-400',
  'bg-yellow-400',
  'bg-green-500',
]

function StrengthBar({ password }) {
  if (!password) return null
  const score = password.length < 6 ? 0 : scorePassword(password)
  const label = STRENGTH_LABELS[score]
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              score >= i ? STRENGTH_COLORS[score] : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-orange-500' : score === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
        {label}
      </p>
    </div>
  )
}

function PasswordInput({ id, value, onChange, placeholder, label, htmlFor }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor || id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
          className="pl-9 pr-10 min-h-[44px]"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  async function handlePasswordUpdate(e) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.')
      return
    }

    setLoading(true)
    try {
      // Re-authenticate with current password first to verify identity
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setError('Unable to verify your session. Please sign in again.')
        setLoading(false)
        return
      }

      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (reAuthError) {
        setError('Current password is incorrect.')
        setLoading(false)
        return
      }

      // Now update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper className="max-w-2xl">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <PageHeader
        title="Change Password"
        subtitle="Update your account password to keep your account secure."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
        className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden"
      >
        {/* Card header strip */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 bg-neutral-50">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-800">Password & Security</p>
            <p className="text-xs text-neutral-500">Use a strong, unique password you don't use elsewhere.</p>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center py-10 gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Password Updated!</h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Your password has been changed successfully.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="min-h-[44px] px-8 mt-2"
                  onClick={() => navigate('/')}
                >
                  Back to Dashboard
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handlePasswordUpdate}
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Current Password */}
                <PasswordInput
                  id="currentPassword"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />

                {/* Divider */}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-100" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-neutral-400 uppercase tracking-wider">
                      New Password
                    </span>
                  </div>
                </div>

                {/* New Password + strength meter */}
                <div className="space-y-2">
                  <PasswordInput
                    id="newPassword"
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                  <StrengthBar password={newPassword} />
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <PasswordInput
                    id="confirmPassword"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                  />
                  {/* Match indicator */}
                  {confirmPassword && newPassword && (
                    <p
                      className={`text-xs font-medium ${
                        confirmPassword === newPassword ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {confirmPassword === newPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {/* Password requirements hint */}
                <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-neutral-600 mb-1.5">Password requirements:</p>
                  {[
                    { label: 'At least 8 characters', met: newPassword.length >= 8 },
                    { label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(newPassword) },
                    { label: 'One number (0–9)', met: /[0-9]/.test(newPassword) },
                    { label: 'One special character (!@#$…)', met: /[^A-Za-z0-9]/.test(newPassword) },
                  ].map(({ label, met }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          met ? 'bg-green-500' : 'bg-neutral-300'
                        }`}
                      />
                      <span className={`text-xs ${met ? 'text-green-700' : 'text-neutral-500'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="bg-error-light text-error-dark rounded-lg p-4 text-sm"
                      role="alert"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="sm:flex-1 min-h-[44px]"
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    variant="primary"
                    size="md"
                    className="sm:flex-1 min-h-[44px]"
                    disabled={
                      loading ||
                      !currentPassword ||
                      newPassword.length < 8 ||
                      newPassword !== confirmPassword
                    }
                  >
                    Update Password
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </PageWrapper>
  )
}
