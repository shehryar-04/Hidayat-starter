import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
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
      else navigate('/')
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
    setLoading(true)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) { setError(signUpError.message); return }
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: fullName,
          role: 'student',
        })
        if (profileError) { setError('Account created but profile setup failed: ' + profileError.message); return }
        setSuccess('Account created! Please check your email to confirm your account.')
        setEmail(''); setPassword(''); setConfirmPassword(''); setFullName('')
        setTimeout(() => { setIsSignUp(false); setSuccess(null) }, 2000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsSignUp(!isSignUp)
    setError(null); setSuccess(null)
    setEmail(''); setPassword(''); setConfirmPassword(''); setFullName('')
  }

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☪️</div>
          <h1 className="text-3xl font-bold text-primary">Hidayat</h1>
          <p className="text-gray-500 text-sm mt-1">Learning Management System</p>
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
          </div>
        </div>
      </div>
    </div>
  )
}
