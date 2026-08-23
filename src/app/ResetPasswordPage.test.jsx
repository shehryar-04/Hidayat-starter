import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ResetPasswordPage from './ResetPasswordPage'
import { supabase } from '../lib/supabase'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
    },
  },
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render password reset form', () => {
    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: 'Reset Your Password' })).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument()
  })

  it('should show error when passwords do not match', async () => {
    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: /Update Password/i })

    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password321' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('should show error when password is less than 6 characters', async () => {
    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: /Update Password/i })

    fireEvent.change(passwordInput, { target: { value: '12345' } })
    fireEvent.change(confirmInput, { target: { value: '12345' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('should update password and redirect to login on success', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      error: null,
    })

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: /Update Password/i })

    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/Password updated successfully! Redirecting you to login.../i)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    }, { timeout: 3000 })
  })
})
