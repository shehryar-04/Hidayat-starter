import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StudentSearch } from './StudentSearch'
import * as supabaseModule from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('StudentSearch', () => {
  const mockStudents = [
    {
      id: '1',
      enrollment_number: 'ENR001',
      profile_id: 'prof1',
      status: 'active',
      enrollment_date: '2024-01-01',
      created_at: '2024-01-01',
    },
    {
      id: '2',
      enrollment_number: 'ENR002',
      profile_id: 'prof2',
      status: 'active',
      enrollment_date: '2024-01-02',
      created_at: '2024-01-02',
    },
  ]

  const mockProfiles = [
    { id: 'prof1', full_name: 'Ahmed Ali' },
    { id: 'prof2', full_name: 'Fatima Khan' },
  ]

  const mockLevels = [
    { id: 'level1', name: 'Level 1' },
    { id: 'level2', name: 'Level 2' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search form with all filter fields', () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockLevels }),
      }),
    })
    supabaseModule.supabase.from = mockFrom

    render(<StudentSearch onSelectStudent={vi.fn()} />)

    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search by enrollment number...')).toBeInTheDocument()
    expect(screen.getByText('Program')).toBeInTheDocument()
    expect(screen.getByText('Academic Level')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('displays no results message when search returns empty', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockLevels }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<StudentSearch onSelectStudent={vi.fn()} />)

    const enrollmentInput = screen.getByPlaceholderText('Search by enrollment number...')
    fireEvent.change(enrollmentInput, { target: { value: 'NONEXISTENT' } })

    const searchButton = screen.getByText('Search')
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText('No students found matching your criteria.')).toBeInTheDocument()
    })
  })

  it('loads academic levels on mount', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockLevels }),
      }),
    })
    supabaseModule.supabase.from = mockFrom

    render(<StudentSearch onSelectStudent={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Level 1')).toBeInTheDocument()
      expect(screen.getByText('Level 2')).toBeInTheDocument()
    })
  })

  it('renders search form with status options', () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockLevels }),
      }),
    })
    supabaseModule.supabase.from = mockFrom

    render(<StudentSearch onSelectStudent={vi.fn()} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Suspended')).toBeInTheDocument()
    expect(screen.getByText('Graduated')).toBeInTheDocument()
    expect(screen.getByText('Withdrawn')).toBeInTheDocument()
  })
})
