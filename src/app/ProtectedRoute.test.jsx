import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import * as RoleProviderModule from './RoleProvider'

// Mock the useRole hook
vi.mock('./RoleProvider', () => ({
  useRole: vi.fn(),
}))

describe('ProtectedRoute', () => {
  it('should display loading state when loading', () => {
    vi.mocked(RoleProviderModule.useRole).mockReturnValue({
      role: null,
      userId: null,
      loading: true,
      signOut: vi.fn(),
    })

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render protected content when user is authenticated', () => {
    vi.mocked(RoleProviderModule.useRole).mockReturnValue({
      role: 'student',
      userId: 'test-user-id',
      loading: false,
      signOut: vi.fn(),
    })

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', () => {
    vi.mocked(RoleProviderModule.useRole).mockReturnValue({
      role: null,
      userId: null,
      loading: false,
      signOut: vi.fn(),
    })

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    )

    // When redirected, the protected content should not be visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
