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
  const { role, userId, loading } = useRole()
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="role">{role || 'no-role'}</div>
      <div data-testid="userId">{userId || 'no-userId'}</div>
    </div>
  )
}

describe('RoleProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('should redirect to login when unauthenticated', async () => {
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

    expect(screen.getByTestId('role')).toHaveTextContent('no-role')
    expect(screen.getByTestId('userId')).toHaveTextContent('no-userId')
  })

  it('should handle role changes on auth state change', async () => {
    const mockUserId = 'test-user-id'
    const mockRole = 'admin'

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

    // Initially no role
    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent('no-role')
    })

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
