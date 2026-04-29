import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HifzProgressGrid } from './HifzProgressGrid'
import * as supabaseModule from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}))

describe('HifzProgressGrid', () => {
  const mockStudent = {
    id: 'student1',
    enrollment_number: 'ENR001',
    profile_id: 'prof1',
    profiles: {
      id: 'prof1',
      full_name: 'Ahmed Ali',
    },
  }

  const mockProgress = [
    {
      id: 'prog1',
      student_id: 'student1',
      juz_number: 1,
      status: 'memorized',
      memorized_at: '2024-01-01',
      scholar_id: 'scholar1',
    },
    {
      id: 'prog2',
      student_id: 'student1',
      juz_number: 2,
      status: 'in_progress',
      memorized_at: null,
      scholar_id: 'scholar1',
    },
  ]

  const mockAuditLog = [
    {
      id: 'audit1',
      student_id: 'student1',
      juz_number: 1,
      old_status: 'in_progress',
      new_status: 'memorized',
      changed_at: '2024-01-01T10:00:00Z',
      profiles: {
        id: 'prof2',
        full_name: 'Dr. Ahmed',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Hifz progress grid with student info', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockAuditLog }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<HifzProgressGrid student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Ahmed Ali/)).toBeInTheDocument()
      expect(screen.getByText(/ENR001/)).toBeInTheDocument()
    })
  })

  it('displays all 30 Juz cards', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<HifzProgressGrid student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Juz 1')).toBeInTheDocument()
      expect(screen.getByText('Juz 30')).toBeInTheDocument()
    })
  })

  it('logs status changes to audit log', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user1' } },
    })

    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockAuditLog }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ id: 'scholar1' }] }),
        }),
      })
      .mockReturnValueOnce({
        update: mockUpdate,
      })
      .mockReturnValueOnce({
        insert: mockInsert,
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockAuditLog }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser

    render(<HifzProgressGrid student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Juz 1')).toBeInTheDocument()
    })

    // Find and click a status button
    const statusButtons = screen.getAllByRole('button')
    const memorizedButton = statusButtons.find((btn) => btn.textContent === '●')

    if (memorizedButton) {
      fireEvent.click(memorizedButton)

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled()
      })
    }
  })

  it('detects when all 30 Juz are memorized', async () => {
    const allMemorized = Array.from({ length: 30 }, (_, i) => ({
      id: `prog${i + 1}`,
      student_id: 'student1',
      juz_number: i + 1,
      status: 'memorized',
      memorized_at: '2024-01-01',
      scholar_id: 'scholar1',
    }))

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: allMemorized }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<HifzProgressGrid student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Hifz Complete/)).toBeInTheDocument()
    })
  })

  it('displays audit log when toggled', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockAuditLog }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<HifzProgressGrid student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Show Audit Log')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Show Audit Log'))

    await waitFor(() => {
      expect(screen.getByText('Change History')).toBeInTheDocument()
      expect(screen.getByText('Dr. Ahmed')).toBeInTheDocument()
    })
  })

  it('calls onBack when back button is clicked', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    const onBack = vi.fn()

    render(<HifzProgressGrid student={mockStudent} onBack={onBack} />)

    await waitFor(() => {
      expect(screen.getByText('← Back to Search')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('← Back to Search'))
    expect(onBack).toHaveBeenCalled()
  })
})
