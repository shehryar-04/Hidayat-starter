import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PublicationRepository } from './PublicationRepository'
import * as supabaseModule from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}))

describe('PublicationRepository', () => {
  const mockPublications = [
    {
      id: 'pub1',
      title: 'Islamic Studies Research',
      abstract: 'A comprehensive study...',
      authors: ['Dr. Ahmed', 'Dr. Fatima'],
      publication_type: 'paper',
      file_path: 'publications/paper1.pdf',
      status: 'published',
      submitted_by: 'scholar1',
      submitted_at: '2024-01-01',
      download_count: 5,
      profiles: {
        id: 'scholar1',
        full_name: 'Dr. Ahmed Al-Aziz',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders publication repository', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPublications }),
        }),
      }),
    })

    supabaseModule.supabase.from = mockFrom

    render(<PublicationRepository />)

    await waitFor(() => {
      expect(screen.getByText('Islamic Studies Research')).toBeInTheDocument()
    })
  })

  it('displays publication details', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPublications }),
        }),
      }),
    })

    supabaseModule.supabase.from = mockFrom

    const { container } = render(<PublicationRepository />)

    await waitFor(() => {
      expect(screen.getByText(/A comprehensive study/)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getAllByText(/Research Paper/i).length).toBeGreaterThan(0)
    })

    expect(container.innerHTML).toContain('Dr. Ahmed, Dr. Fatima')
  })

  it('displays download count', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPublications }),
        }),
      }),
    })

    supabaseModule.supabase.from = mockFrom

    render(<PublicationRepository />)

    await waitFor(() => {
      expect(screen.getByText(/5.*downloads/i)).toBeInTheDocument()
    })
  })

  it('allows searching by title', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPublications }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockPublications }),
            }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<PublicationRepository />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by title/i)).toBeInTheDocument()
    })

    const titleInput = screen.getByPlaceholderText(/Search by title/i)
    fireEvent.change(titleInput, { target: { value: 'Islamic' } })

    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => {
      expect(screen.getByText('Islamic Studies Research')).toBeInTheDocument()
    })
  })

  it('allows filtering by publication type', async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPublications }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockPublications }),
            }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom

    render(<PublicationRepository />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument()
    })

    const typeSelect = screen.getByDisplayValue('All Types')
    fireEvent.change(typeSelect, { target: { value: 'paper' } })

    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => {
      expect(screen.getByText('Islamic Studies Research')).toBeInTheDocument()
    })
  })

  it('shows download button for publications with files', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPublications }),
        }),
      }),
    })

    supabaseModule.supabase.from = mockFrom

    render(<PublicationRepository />)

    await waitFor(() => {
      expect(screen.getByText(/Download PDF/i)).toBeInTheDocument()
    })
  })

  it('increments download count on download', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const mockStorageFrom = vi.fn().mockReturnValue({
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'http://example.com/file.pdf' },
      }),
    })

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPublications }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: mockUpdate,
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPublications }),
          }),
        }),
      })

    supabaseModule.supabase.from = mockFrom
    supabaseModule.supabase.storage.from = mockStorageFrom

    render(<PublicationRepository />)

    await waitFor(() => {
      expect(screen.getByText(/Download PDF/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/Download PDF/i))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })
})
