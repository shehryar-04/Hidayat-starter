import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ScholarProfile } from './ScholarProfile'
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

describe('ScholarProfile', () => {
  const mockScholar = {
    id: 'scholar1',
    profile_id: 'prof1',
    qualifications: ['MA Islamic Studies', 'BA Arabic'],
    specializations: ['Quranic Sciences', 'Islamic Law'],
    contact_info: { email: 'scholar@example.com', phone: '123456789' },
    employment_status: 'active',
    created_at: '2024-01-01',
    profiles: {
      id: 'prof1',
      full_name: 'Dr. Ahmed Al-Aziz',
      role: 'scholar',
    },
  }

  const mockAssignments = {
    subjects: [
      {
        id: 'assign1',
        scholar_id: 'scholar1',
        subject_id: 'subj1',
        assigned_at: '2024-01-01',
        dars_e_nizami_subjects: {
          id: 'subj1',
          name: 'Tafsir',
          level_id: 'level1',
          dars_e_nizami_levels: {
            id: 'level1',
            name: 'Level 1',
          },
        },
      },
    ],
    programs: [
      {
        id: 'prog1',
        scholar_id: 'scholar1',
        program: 'Dars-e-Nizami',
        assigned_at: '2024-01-01',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders scholar profile with basic information', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAssignments.subjects }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAssignments.programs }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(
      <ScholarProfile
        scholar={mockScholar}
        onBack={vi.fn()}
        onDeactivate={vi.fn()}
      />
    )

    expect(screen.getByText('Dr. Ahmed Al-Aziz')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('displays scholar qualifications and specializations', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAssignments.subjects }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAssignments.programs }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(
      <ScholarProfile
        scholar={mockScholar}
        onBack={vi.fn()}
        onDeactivate={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('MA Islamic Studies')).toBeInTheDocument()
      expect(screen.getByText('Quranic Sciences')).toBeInTheDocument()
    })
  })

  it('displays subject assignments', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAssignments.subjects }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAssignments.programs }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(
      <ScholarProfile
        scholar={mockScholar}
        onBack={vi.fn()}
        onDeactivate={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Tafsir')).toBeInTheDocument()
      expect(screen.getByText('Level 1')).toBeInTheDocument()
    })
  })

  it('displays program assignments', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAssignments.subjects }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAssignments.programs }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(
      <ScholarProfile
        scholar={mockScholar}
        onBack={vi.fn()}
        onDeactivate={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Dars-e-Nizami')).toBeInTheDocument()
    })
  })

  it('shows deactivation button for active scholars', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(
      <ScholarProfile
        scholar={mockScholar}
        onBack={vi.fn()}
        onDeactivate={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Deactivate Scholar')).toBeInTheDocument()
    })
  })

  it('handles deactivation with confirmation', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'admin1' } },
    })

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        update: mockUpdate,
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser

    const onDeactivate = vi.fn()

    render(
      <ScholarProfile
        scholar={mockScholar}
        onBack={vi.fn()}
        onDeactivate={onDeactivate}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Deactivate Scholar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Deactivate Scholar'))

    await waitFor(() => {
      expect(
        screen.getByText('Are you sure?')
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Confirm Deactivation'))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('calls onBack when back button is clicked', () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    const onBack = vi.fn()

    render(
      <ScholarProfile
        scholar={mockScholar}
        onBack={onBack}
        onDeactivate={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('← Back to Search'))
    expect(onBack).toHaveBeenCalled()
  })
})
