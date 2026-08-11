import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FatwaResponseEditor } from './FatwaResponseEditor'
import * as supabaseModule from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}))

describe('FatwaResponseEditor', () => {
  const mockQuestion = {
    id: 'q1',
    reference_number: 'FQ-123456-789',
    submitted_by: 'user1',
    question_text: 'Is it permissible to...',
    context: 'Some context',
    status: 'pending',
    assigned_mufti: null,
    duplicate_of: null,
    created_at: '2024-01-01',
  }

  const mockResponses = [
    {
      id: 'resp1',
      question_id: 'q1',
      mufti_id: 'mufti1',
      response_text: 'The answer is...',
      submitted_at: '2024-01-02',
      profiles: {
        id: 'mufti1',
        full_name: 'Dr. Mufti Ahmed',
      },
    },
  ]

  const mockAuditLog = [
    {
      id: 'audit1',
      question_id: 'q1',
      old_status: 'pending',
      new_status: 'assigned',
      acted_at: '2024-01-01T10:00:00Z',
      profiles: {
        id: 'admin1',
        full_name: 'Admin User',
      },
    },
  ]

  let currentRole = 'mufti'
  let currentResponses = mockResponses
  let currentAuditLog = mockAuditLog

  const mockInsert = vi.fn().mockResolvedValue({ error: null })
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })

  const mockFrom = vi.fn((table) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => Promise.resolve({ data: { role: currentRole } })),
          }),
        }),
      }
    }
    if (table === 'fatwa_responses') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockImplementation(() => Promise.resolve({ data: currentResponses })),
          }),
        }),
        insert: mockInsert,
      }
    }
    if (table === 'fatwa_audit_log') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockImplementation(() => Promise.resolve({ data: currentAuditLog })),
          }),
        }),
        insert: mockInsert,
      }
    }
    if (table === 'fatwa_questions') {
      return {
        update: mockUpdate,
      }
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      insert: mockInsert,
      update: mockUpdate,
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    currentRole = 'mufti'
    currentResponses = mockResponses
    currentAuditLog = mockAuditLog
  })

  it('renders question content', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user1' } },
    })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser

    render(
      <FatwaResponseEditor
        question={mockQuestion}
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/FQ-123456-789/)).toBeInTheDocument()
      expect(screen.getByText(/Is it permissible to/)).toBeInTheDocument()
    })
  })

  it('displays existing responses', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user1' } },
    })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser

    render(
      <FatwaResponseEditor
        question={mockQuestion}
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Dr. Mufti Ahmed')).toBeInTheDocument()
      expect(screen.getByText('The answer is...')).toBeInTheDocument()
    })
  })

  it('allows Mufti to submit response', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'mufti1' } },
    })

    currentResponses = []
    currentAuditLog = []

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser

    render(
      <FatwaResponseEditor
        question={mockQuestion}
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Submit Fatwa Response')).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText('Enter your fatwa response...')
    fireEvent.change(textarea, { target: { value: 'My response' } })

    fireEvent.click(screen.getByText('Submit Response'))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    })
  })

  it('displays audit log when toggled', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user1' } },
    })

    currentRole = 'admin'
    currentResponses = []
    currentAuditLog = mockAuditLog

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser

    render(
      <FatwaResponseEditor
        question={mockQuestion}
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Show Audit Log')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Show Audit Log'))

    await waitFor(() => {
      expect(screen.getByText('Status History')).toBeInTheDocument()
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })
  })

  it('calls onBack when back button is clicked', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user1' } },
    })

    currentResponses = []
    currentAuditLog = []

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser

    const onBack = vi.fn()

    render(
      <FatwaResponseEditor
        question={mockQuestion}
        onBack={onBack}
        onComplete={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('← Back to Questions')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('← Back to Questions'))
    expect(onBack).toHaveBeenCalled()
  })
})
