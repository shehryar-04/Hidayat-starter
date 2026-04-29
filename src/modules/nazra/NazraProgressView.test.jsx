import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NazraProgressView } from './NazraProgressView'
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

describe('NazraProgressView', () => {
  const mockStudent = {
    id: 'student1',
    enrollment_number: 'ENR001',
    profile_id: 'prof1',
    profiles: {
      id: 'prof1',
      full_name: 'Ahmed Ali',
    },
  }

  const mockLessons = [
    { id: 'lesson1', sequence_order: 1, title: 'Surah Al-Fatiha' },
    { id: 'lesson2', sequence_order: 2, title: 'Surah Al-Baqarah (Part 1)' },
    { id: 'lesson3', sequence_order: 3, title: 'Surah Al-Baqarah (Part 2)' },
  ]

  const mockProgress = [
    {
      id: 'prog1',
      student_id: 'student1',
      lesson_id: 'lesson1',
      completed_at: '2024-01-01',
      scholar_id: 'scholar1',
      quality_note: 'Good pronunciation',
      scholars: {
        id: 'scholar1',
        profile_id: 'prof2',
        profiles: {
          id: 'prof2',
          full_name: 'Dr. Ahmed',
        },
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Nazra progress view with student info', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockLessons }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<NazraProgressView student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Ahmed Ali/)).toBeInTheDocument()
      expect(screen.getByText(/ENR001/)).toBeInTheDocument()
    })
  })

  it('displays all lessons', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockLessons }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<NazraProgressView student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Surah Al-Fatiha')).toBeInTheDocument()
      expect(screen.getByText('Surah Al-Baqarah (Part 1)')).toBeInTheDocument()
    })
  })

  it('marks lessons as completed', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user1' } },
    })

    const mockInsert = vi.fn().mockResolvedValue({ error: null })

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockLessons }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ id: 'scholar1' }] }),
        }),
      })
      .mockReturnValueOnce({
        insert: mockInsert,
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockLessons }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser

    render(<NazraProgressView student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Mark Lesson Complete')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Mark Lesson Complete'))

    await waitFor(() => {
      expect(screen.getByText('Lesson')).toBeInTheDocument()
    })
  })

  it('displays quality notes for completed lessons', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockLessons }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<NazraProgressView student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Good pronunciation')).toBeInTheDocument()
    })
  })

  it('detects when all lessons are completed', async () => {
    const allCompleted = mockLessons.map((lesson, idx) => ({
      id: `prog${idx + 1}`,
      student_id: 'student1',
      lesson_id: lesson.id,
      completed_at: '2024-01-01',
      scholar_id: 'scholar1',
      quality_note: null,
      scholars: {
        id: 'scholar1',
        profile_id: 'prof2',
        profiles: {
          id: 'prof2',
          full_name: 'Dr. Ahmed',
        },
      },
    }))

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockLessons }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: allCompleted }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<NazraProgressView student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Nazra Complete/)).toBeInTheDocument()
    })
  })

  it('shows progress percentage', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockLessons }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProgress }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<NazraProgressView student={mockStudent} onBack={vi.fn()} />)

    await waitFor(() => {
      // 1 out of 3 lessons = 33%
      expect(screen.getByText(/1 \/ 3 lessons/)).toBeInTheDocument()
    })
  })

  it('calls onBack when back button is clicked', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockLessons }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    const onBack = vi.fn()

    render(<NazraProgressView student={mockStudent} onBack={onBack} />)

    await waitFor(() => {
      expect(screen.getByText('← Back to Search')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('← Back to Search'))
    expect(onBack).toHaveBeenCalled()
  })
})
