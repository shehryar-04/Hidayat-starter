import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ResetPasswordPage from './ResetPasswordPage'
import { supabase } from '../lib/supabase'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
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
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { email: 'test@example.com' } },
    })
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: null,
    })
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      error: null,
    })
  })

  it('should render password reset form', () => {
    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument()
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument()
  })

  it('should disable submit button when passwords do not match', () => {
    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const currentInput = screen.getByLabelText('Current Password')
    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm New Password')
    const submitButton = screen.getByRole('button', { name: /Update Password/i })

    fireEvent.change(currentInput, { target: { value: 'oldpass123' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password321' } })

    expect(submitButton).toBeDisabled()
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('should disable submit button when password is less than 8 characters', () => {
    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const currentInput = screen.getByLabelText('Current Password')
    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm New Password')
    const submitButton = screen.getByRole('button', { name: /Update Password/i })

    fireEvent.change(currentInput, { target: { value: 'oldpass123' } })
    fireEvent.change(passwordInput, { target: { value: '12345' } })
    fireEvent.change(confirmInput, { target: { value: '12345' } })

    expect(submitButton).toBeDisabled()
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('should update password and show success on valid submit', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      error: null,
    })

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const currentInput = screen.getByLabelText('Current Password')
    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm New Password')
    const submitButton = screen.getByRole('button', { name: /Update Password/i })

    fireEvent.change(currentInput, { target: { value: 'oldpass123' } })
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/Password Updated!/i)).toBeInTheDocument()
    })
  })
})
