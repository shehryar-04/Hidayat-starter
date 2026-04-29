import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EvaluationView } from './EvaluationView'
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

describe('EvaluationView', () => {
  const mockStudent = {
    id: 'student1',
    enrollment_number: 'ENR001',
    profile_id: 'prof1',
    profiles: {
      id: 'prof1',
      full_name: 'Ahmed Ali',
    },
  }

  const mockLevel = {
    id: 'level1',
    name: 'Level 1',
    sequence_order: 1,
    passing_threshold: 50,
  }

  const mockSubjects = [
    { id: 'subj1', name: 'Tafsir', level_id: 'level1' },
    { id: 'subj2', name: 'Hadith', level_id: 'level1' },
  ]

  const mockEvaluations = [
    {
      id: 'eval1',
      student_id: 'student1',
      subject_id: 'subj1',
      level_id: 'level1',
      scholar_id: 'scholar1',
      score: 75,
      evaluated_at: '2024-01-01',
      flagged: false,
      dars_e_nizami_subjects: { id: 'subj1', name: 'Tafsir' },
      scholars: {
        id: 'scholar1',
        profile_id: 'prof2',
        profiles: { id: 'prof2', full_name: 'Dr. Ahmed' },
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders evaluation view with student and level info', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockEvaluations }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockSubjects }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockSubjects }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(
      <EvaluationView selectedStudent={mockStudent} selectedLevel={mockLevel} />
    )

    await waitFor(() => {
      expect(screen.getByText(/Ahmed Ali/)).toBeInTheDocument()
      expect(screen.getByText(/Level 1/)).toBeInTheDocument()
    })
  })

  it('displays recorded evaluations', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockEvaluations }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockSubjects }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockSubjects }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(
      <EvaluationView selectedStudent={mockStudent} selectedLevel={mockLevel} />
    )

    await waitFor(() => {
      expect(screen.getByText('Tafsir')).toBeInTheDocument()
      expect(screen.getByText('75')).toBeInTheDocument()
    })
  })

  it('flags evaluations below passing threshold', async () => {
    const flaggedEvaluation = {
      ...mockEvaluations[0],
      score: 40,
      flagged: true,
    }

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [flaggedEvaluation] }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockSubjects }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockSubjects }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(
      <EvaluationView selectedStudent={mockStudent} selectedLevel={mockLevel} />
    )

    await waitFor(() => {
      expect(screen.getByText('Below Threshold')).toBeInTheDocument()
    })
  })

  it('detects level completion when all subjects have passing evaluations', async () => {
    const passingEvaluations = [
      { ...mockEvaluations[0], score: 75, flagged: false },
      {
        ...mockEvaluations[0],
        id: 'eval2',
        subject_id: 'subj2',
        score: 80,
        flagged: false,
      },
    ]

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: passingEvaluations }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockSubjects }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockSubjects }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockSubjects }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(
      <EvaluationView selectedStudent={mockStudent} selectedLevel={mockLevel} />
    )

    await waitFor(() => {
      expect(screen.getByText(/Level Complete/)).toBeInTheDocument()
    })
  })

  it('shows message when no student or level selected', () => {
    render(<EvaluationView selectedStudent={null} selectedLevel={null} />)

    expect(
      screen.getByText(/Please select a student and level/)
    ).toBeInTheDocument()
  })
})
