import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnrollmentView } from './EnrollmentView'
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

describe('EnrollmentView', () => {
  const mockCourse = {
    id: 'course1',
    title: 'Islamic Studies 101',
    description: 'Introduction to Islamic Studies',
    duration_weeks: 4,
    fee: 100,
    start_date: '2024-01-01',
    end_date: '2024-02-01',
    certificate_template: 'Certificate template',
    created_by: 'admin1',
  }

  const mockEnrollments = [
    {
      id: 'enroll1',
      course_id: 'course1',
      student_id: 'student1',
      enrolled_at: '2024-01-01',
      payment_ref: 'PAY001',
      status: 'active',
      completed_at: null,
      students: {
        id: 'student1',
        enrollment_number: 'ENR001',
        profile_id: 'prof1',
        profiles: {
          id: 'prof1',
          full_name: 'Ahmed Ali',
        },
      },
    },
  ]

  const mockStudents = [
    {
      id: 'student1',
      enrollment_number: 'ENR001',
      profile_id: 'prof1',
      profiles: {
        id: 'prof1',
        full_name: 'Ahmed Ali',
      },
    },
  ]

  let currentEnrollments = mockEnrollments
  let currentStudents = mockStudents

  const mockInsert = vi.fn().mockResolvedValue({ error: null })
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })

  const mockFrom = vi.fn((table) => {
    if (table === 'short_course_enrollments') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockImplementation(() => Promise.resolve({ data: currentEnrollments })),
          }),
        }),
        insert: mockInsert,
        update: mockUpdate,
      }
    }
    if (table === 'students') {
      const orderFn = vi.fn().mockImplementation(() => Promise.resolve({ data: currentStudents }))
      return {
        select: vi.fn().mockReturnValue({
          order: orderFn,
          eq: vi.fn().mockReturnValue({
            order: orderFn,
          }),
        }),
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
    currentEnrollments = mockEnrollments
    currentStudents = mockStudents
  })

  it('renders enrollment view with course title', async () => {
    supabaseModule.supabase.from = mockFrom

    render(<EnrollmentView course={mockCourse} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Islamic Studies 101/)).toBeInTheDocument()
    })
  })

  it('displays enrolled students', async () => {
    supabaseModule.supabase.from = mockFrom

    render(<EnrollmentView course={mockCourse} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument()
      expect(screen.getByText('ENR001')).toBeInTheDocument()
    })
  })

  it('allows enrolling new students', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user1' } },
    })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.auth.getUser = mockGetUser

    render(<EnrollmentView course={mockCourse} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Enroll Student/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Enroll Student/i }))

    await waitFor(() => {
      expect(screen.getByText('Student')).toBeInTheDocument()
    })
  })

  it('marks enrollment as completed', async () => {
    supabaseModule.supabase.from = mockFrom

    render(<EnrollmentView course={mockCourse} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Complete/i }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('calls onBack when back button is clicked', async () => {
    currentEnrollments = []
    currentStudents = []

    supabaseModule.supabase.from = mockFrom

    const onBack = vi.fn()

    render(<EnrollmentView course={mockCourse} onBack={onBack} />)

    await waitFor(() => {
      expect(screen.getByText(/Back to Courses/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/Back to Courses/i))
    expect(onBack).toHaveBeenCalled()
  })
})
