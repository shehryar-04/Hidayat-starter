import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { RoleProvider, useRole } from './RoleProvider'
import { supabase } from '../lib/supabase'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}))

// Test component that uses the role context
function TestComponent() {
  const { role, userId, loading, switchRole } = useRole()
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="role">{role || 'no-role'}</div>
      <div data-testid="userId">{userId || 'no-userId'}</div>
      <button data-testid="switch-student" onClick={() => switchRole('student')}>Switch to Student</button>
      <button data-testid="switch-admin" onClick={() => switchRole('admin')}>Switch to Admin</button>
    </div>
  )
}

describe('RoleProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should load role from profile record on authentication', async () => {
    const mockUserId = 'test-user-id'
    const mockRole = 'student'

    // Mock getSession to return a session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: mockUserId },
        },
      },
    })

    // Mock onAuthStateChange to return a subscription
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })

    // Mock the profiles query
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

    render(
      <RoleProvider>
        <TestComponent />
      </RoleProvider>
    )

    // Wait for role to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent(mockRole)
    })

    expect(screen.getByTestId('userId')).toHaveTextContent(mockUserId)
    expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
  })

  it('should support switching role between admin and student in testing mode', async () => {
    // Mock getSession to return no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: null,
      },
    })

    // Mock onAuthStateChange to return a subscription
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })

    render(
      <RoleProvider>
        <TestComponent />
      </RoleProvider>
    )

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    // Default test role is admin
    expect(screen.getByTestId('role')).toHaveTextContent('admin')

    // Switch to student
    screen.getByTestId('switch-student').click()
    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent('student')
    })
    expect(localStorage.getItem('hidayat_test_role')).toBe('student')

    // Switch back to admin
    screen.getByTestId('switch-admin').click()
    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent('admin')
    })
    expect(localStorage.getItem('hidayat_test_role')).toBe('admin')
  })

  it('should handle role changes on auth state change', async () => {
    const mockUserId = 'test-user-id'
    const mockRole = 'student'

    // Mock getSession to return no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: null,
      },
    })

    // Mock onAuthStateChange to capture the callback
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

    // Mock the profiles query
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

    render(
      <RoleProvider>
        <TestComponent />
      </RoleProvider>
    )

    // Simulate auth state change
    authStateChangeCallback('SIGNED_IN', {
      user: { id: mockUserId },
    })

    // Wait for role to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent(mockRole)
    })

    expect(screen.getByTestId('userId')).toHaveTextContent(mockUserId)
  })
})
