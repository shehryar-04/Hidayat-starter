import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import { supabase } from '../lib/supabase'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with email and password fields', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    expect(screen.getByText('Hidayat')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('should display error message on failed sign-in', async () => {
    const errorMessage = 'Invalid credentials'
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: { message: errorMessage },
    })

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /Sign In/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('should call signInWithPassword with email and password', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: null,
    })

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /Sign In/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('should switch to forgot password mode and trigger resetPasswordForEmail', async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      error: null,
    })

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    // Click Forgot password?
    const forgotPasswordLink = screen.getByRole('button', { name: /Forgot password\?/i })
    fireEvent.click(forgotPasswordLink)

    // Should render Reset Password heading and instruction
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument()
    expect(screen.getByText(/Enter your email address and we'll send you a link to reset your password./i)).toBeInTheDocument()

    // Enter email and submit
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'reset@example.com' } })

    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('reset@example.com', {
        redirectTo: expect.stringContaining('/auth/callback?type=recovery'),
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/If an account exists with this email, a password reset link has been sent./i)).toBeInTheDocument()
    })
  })
})
