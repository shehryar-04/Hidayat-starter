import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EligibilityEvaluation } from './EligibilityEvaluation'
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

describe('EligibilityEvaluation', () => {
  const mockWazifaRules = {
    id: 'rules1',
    version: 1,
    rules: {
      min_attendance: 80,
      min_gpa: 3.0,
      max_family_income: 50000,
    },
    active: true,
    updated_at: '2024-01-01',
  }

  const mockEvaluationResults = {
    total_evaluated: 100,
    eligible_count: 45,
    total_stipend_amount: 22500,
    rule_version: 1,
    evaluated_at: '2024-01-15T10:00:00Z',
    eligible_students: [
      {
        student_id: 'student1',
        student_name: 'Ahmed Ali',
        enrollment_number: 'ENR001',
        stipend_amount: 500,
        qualifying_rules: ['min_attendance', 'min_gpa'],
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders eligibility evaluation component', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWazifaRules }),
            }),
          }),
        }),
      }),
    })

    supabaseModule.supabase.from = mockFrom

    render(<EligibilityEvaluation />)

    await waitFor(() => {
      expect(screen.getByText('Wazifa Eligibility Evaluation')).toBeInTheDocument()
    })
  })

  it('displays active wazifa rules', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWazifaRules }),
            }),
          }),
        }),
      }),
    })

    supabaseModule.supabase.from = mockFrom

    render(<EligibilityEvaluation />)

    await waitFor(() => {
      expect(screen.getByText('Version: 1')).toBeInTheDocument()
    })
  })

  it('runs eligibility evaluation', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'admin1' } },
    })

    const mockInvoke = vi.fn().mockResolvedValue({
      data: mockEvaluationResults,
      error: null,
    })

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWazifaRules }),
            }),
          }),
        }),
      }),
    })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser
    supabaseModule.supabase.functions.invoke = mockInvoke

    render(<EligibilityEvaluation />)

    await waitFor(() => {
      expect(screen.getByText('Run Eligibility Evaluation')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Run Eligibility Evaluation'))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('evaluate-wazifa', {
        body: { evaluated_by: 'admin1' },
      })
    })
  })

  it('displays evaluation results', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'admin1' } },
    })

    const mockInvoke = vi.fn().mockResolvedValue({
      data: mockEvaluationResults,
      error: null,
    })

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWazifaRules }),
            }),
          }),
        }),
      }),
    })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser
    supabaseModule.supabase.functions.invoke = mockInvoke

    render(<EligibilityEvaluation />)

    await waitFor(() => {
      expect(screen.getByText('Run Eligibility Evaluation')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Run Eligibility Evaluation'))

    await waitFor(() => {
      expect(screen.getByText('Total Students Evaluated: 100')).toBeInTheDocument()
      expect(screen.getByText('Eligible Students: 45')).toBeInTheDocument()
      expect(screen.getByText(/Total Stipend Amount: \$22500/)).toBeInTheDocument()
    })
  })

  it('displays eligible students list', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'admin1' } },
    })

    const mockInvoke = vi.fn().mockResolvedValue({
      data: mockEvaluationResults,
      error: null,
    })

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWazifaRules }),
            }),
          }),
        }),
      }),
    })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser
    supabaseModule.supabase.functions.invoke = mockInvoke

    render(<EligibilityEvaluation />)

    await waitFor(() => {
      expect(screen.getByText('Run Eligibility Evaluation')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Run Eligibility Evaluation'))

    await waitFor(() => {
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument()
      expect(screen.getByText('ENR001')).toBeInTheDocument()
      expect(screen.getByText(/\$500/)).toBeInTheDocument()
    })
  })
})
