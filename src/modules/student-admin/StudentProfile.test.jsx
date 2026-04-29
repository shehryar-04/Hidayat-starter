import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StudentProfile } from './StudentProfile'
import * as supabaseModule from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
  },
}))

// Mock DynamicForm
vi.mock('../../shared/DynamicForm', () => ({
  DynamicForm: ({ onSubmit }) => (
    <form onSubmit={(e) => {
      e.preventDefault()
      onSubmit({ data: {}, schemaVersion: 1 })
    }}>
      <button type="submit">Submit Form</button>
    </form>
  ),
}))

describe('StudentProfile', () => {
  const mockStudent = {
    id: 'student1',
    enrollment_number: 'ENR001',
    profile_id: 'prof1',
    status: 'active',
  }

  const mockProfileData = {
    id: 'student1',
    enrollment_number: 'ENR001',
    full_name: 'Ahmed Ali',
    date_of_birth: '2000-01-01',
    gender: 'M',
    contact_info: {},
    guardian_info: {},
    enrollment_date: '2024-01-01',
    status: 'active',
    profiles: { full_name: 'Ahmed Ali' },
  }

  const mockFormSchema = {
    id: 'schema1',
    form_key: 'student_profile',
    version: 1,
    fields: [
      { key: 'full_name', label: 'Full Name', type: 'text', required: true },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders student profile header with name and enrollment number', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormSchema }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfileData }),
          }),
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

    render(
      <StudentProfile
        student={mockStudent}
        onBack={vi.fn()}
        onStatusChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument()
      expect(screen.getByText(/ENR001/)).toBeInTheDocument()
    })
  })

  it('renders back button and calls onBack when clicked', async () => {
    const mockOnBack = vi.fn()
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormSchema }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfileData }),
          }),
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

    render(
      <StudentProfile
        student={mockStudent}
        onBack={mockOnBack}
        onStatusChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('← Back to Search')).toBeInTheDocument()
    })

    const backButton = screen.getByText('← Back to Search')
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('renders status change buttons', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormSchema }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfileData }),
          }),
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

    render(
      <StudentProfile
        student={mockStudent}
        onBack={vi.fn()}
        onStatusChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Change Status')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Suspended')).toBeInTheDocument()
      expect(screen.getByText('Graduated')).toBeInTheDocument()
      expect(screen.getByText('Withdrawn')).toBeInTheDocument()
    })
  })

  it('records status change with correct old and new status', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'admin1' } },
    })

    let insertedData = null
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormSchema }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfileData }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data
          return Promise.resolve({ error: null })
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
    supabaseModule.supabase.auth.getUser = mockGetUser

    render(
      <StudentProfile
        student={mockStudent}
        onBack={vi.fn()}
        onStatusChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Change Status')).toBeInTheDocument()
    })

    const graduatedButton = screen.getByText('Graduated')
    fireEvent.click(graduatedButton)

    await waitFor(() => {
      expect(insertedData).toBeDefined()
      expect(insertedData.old_status).toBe('active')
      expect(insertedData.new_status).toBe('graduated')
      expect(insertedData.student_id).toBe('student1')
      expect(insertedData.changed_by).toBe('admin1')
    })
  })

  it('renders documents section', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormSchema }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfileData }),
          }),
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

    render(
      <StudentProfile
        student={mockStudent}
        onBack={vi.fn()}
        onStatusChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText('Upload Document:')).toBeInTheDocument()
    })
  })
})
