import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'
import { supabase } from '../lib/supabase'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}))

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show login page when user is not authenticated', async () => {
    // Mock no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    })

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Hidayat')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })
  })

  it('should show dashboard when user is authenticated with valid role', async () => {
    const mockUserId = 'test-user-id'
    const mockRole = 'student'

    // Mock session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: mockUserId },
        },
      },
    })

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })

    // Mock profile query
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { role: mockRole },
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('should handle sign-in flow correctly', async () => {
    const mockUserId = 'test-user-id'
    const mockRole = 'admin'

    // Initial state: no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    })

    let authStateChangeCallback
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }
    })

    // Mock sign-in
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: null,
    })

    // Mock profile query
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { role: mockRole },
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    })

    render(<App />)

    // Initially on login page
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    // Fill in login form
    const emailInput = screen.getByLabelText('Email:')
    const passwordInput = screen.getByLabelText('Password:')
    const submitButton = screen.getByRole('button', { name: /Sign In/i })

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Simulate auth state change after successful sign-in
    await waitFor(() => {
      authStateChangeCallback('SIGNED_IN', {
        user: { id: mockUserId },
      })
    })

    // Should now show dashboard
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })
})
