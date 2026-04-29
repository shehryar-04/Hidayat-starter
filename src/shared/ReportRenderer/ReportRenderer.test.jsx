import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReportRenderer } from './ReportRenderer'
import * as supabaseModule from '../../lib/supabase'

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}))

describe('ReportRenderer', () => {
  const mockSchema = {
    id: 'report-1',
    report_key: 'student-enrollment',
    schema: {
      title: 'Student Enrollment Report',
      query_function: 'generate-report',
      columns: [
        { key: 'name', label: 'Student Name' },
        { key: 'enrollment_number', label: 'Enrollment #' },
        { key: 'program', label: 'Program' },
        { key: 'status', label: 'Status' },
      ],
      empty_state_message: 'No students enrolled',
      export_formats: ['table', 'csv', 'pdf'],
    },
  }

  const mockData = [
    {
      name: 'Ahmed Ali',
      enrollment_number: 'ENR001',
      program: 'Dars-e-Nizami',
      status: 'Active',
    },
    {
      name: 'Fatima Khan',
      enrollment_number: 'ENR002',
      program: 'Hifz',
      status: 'Active',
    },
    {
      name: 'Hassan Ibrahim',
      enrollment_number: 'ENR003',
      program: 'Nazra',
      status: 'Suspended',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Table Rendering', () => {
    it('should render table with data from Edge Function', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Student Enrollment Report')).toBeInTheDocument()
      })

      // Check table headers
      expect(screen.getByText('Student Name')).toBeInTheDocument()
      expect(screen.getByText('Enrollment #')).toBeInTheDocument()
      expect(screen.getByText('Program')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()

      // Check table data
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument()
      expect(screen.getByText('ENR001')).toBeInTheDocument()
      expect(screen.getByText('Dars-e-Nizami')).toBeInTheDocument()
      expect(screen.getByText('Fatima Khan')).toBeInTheDocument()
      expect(screen.getByText('ENR002')).toBeInTheDocument()
      expect(screen.getByText('Hifz')).toBeInTheDocument()
    })

    it('should render all rows from data', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Hassan Ibrahim')).toBeInTheDocument()
      })

      expect(screen.getByText('ENR003')).toBeInTheDocument()
      expect(screen.getByText('Nazra')).toBeInTheDocument()
      expect(screen.getByText('Suspended')).toBeInTheDocument()
    })

    it('should handle missing data values gracefully', async () => {
      const dataWithMissing = [
        {
          name: 'Ahmed Ali',
          enrollment_number: 'ENR001',
          program: 'Dars-e-Nizami',
          status: undefined,
        },
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: dataWithMissing,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Ahmed Ali')).toBeInTheDocument()
      })

      // Should render empty string for missing value
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should display empty state message when no data returned', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('No students enrolled')).toBeInTheDocument()
      })

      // Should not render table
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('should display custom empty state message from schema', async () => {
      const customSchema = {
        ...mockSchema,
        schema: {
          ...mockSchema.schema,
          empty_state_message: 'No wazifa recipients found',
        },
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: customSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      render(<ReportRenderer reportKey="wazifa-report" />)

      await waitFor(() => {
        expect(screen.getByText('No wazifa recipients found')).toBeInTheDocument()
      })
    })

    it('should display default empty message when schema does not specify one', async () => {
      const schemaNoMessage = {
        ...mockSchema,
        schema: {
          ...mockSchema.schema,
          empty_state_message: undefined,
        },
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: schemaNoMessage,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument()
      })
    })
  })

  describe('CSV Export', () => {
    it('should render CSV export button when enabled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })
    })

    it('should have correct CSV button with proper attributes', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        const csvButton = screen.getByText('Export CSV')
        expect(csvButton).toBeInTheDocument()
        expect(csvButton).toHaveClass('export-btn')
        expect(csvButton).toHaveClass('csv-btn')
      })
    })

    it('should handle CSV export with data containing special characters', async () => {
      const dataWithSpecialChars = [
        {
          name: 'Ahmed "Ali" Khan',
          enrollment_number: 'ENR001',
          program: 'Dars-e-Nizami',
          status: 'Active',
        },
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: dataWithSpecialChars,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })

      // Button should be clickable
      const csvButton = screen.getByText('Export CSV')
      expect(csvButton).toBeEnabled()
    })
  })

  describe('PDF Export', () => {
    it('should render PDF export button when enabled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Export PDF')).toBeInTheDocument()
      })
    })

    it('should have correct PDF button with proper attributes', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        const pdfButton = screen.getByText('Export PDF')
        expect(pdfButton).toBeInTheDocument()
        expect(pdfButton).toHaveClass('export-btn')
        expect(pdfButton).toHaveClass('pdf-btn')
      })
    })
  })

  describe('Export Format Control', () => {
    it('should only show export buttons for enabled formats', async () => {
      const schemaTableOnly = {
        ...mockSchema,
        schema: {
          ...mockSchema.schema,
          export_formats: ['table'],
        },
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: schemaTableOnly,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Student Enrollment Report')).toBeInTheDocument()
      })

      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument()
      expect(screen.queryByText('Export PDF')).not.toBeInTheDocument()
    })

    it('should show CSV and PDF buttons when enabled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
        expect(screen.getByText('Export PDF')).toBeInTheDocument()
      })
    })

    it('should show only CSV when only CSV is enabled', async () => {
      const schemaCsvOnly = {
        ...mockSchema,
        schema: {
          ...mockSchema.schema,
          export_formats: ['table', 'csv'],
        },
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: schemaCsvOnly,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })

      expect(screen.queryByText('Export PDF')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error when schema fetch fails', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Schema not found'),
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom

      const mockOnError = vi.fn()

      render(
        <ReportRenderer reportKey="nonexistent" onError={mockOnError} />
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })

      expect(mockOnError).toHaveBeenCalled()
    })

    it('should display error when Edge Function fails', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Function execution failed'),
      })

      const mockOnError = vi.fn()

      render(
        <ReportRenderer reportKey="student-enrollment" onError={mockOnError} />
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })

      expect(mockOnError).toHaveBeenCalled()
    })

    it('should display error message when report key is invalid', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Report not found'),
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom

      render(<ReportRenderer reportKey="invalid-key" />)

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should display loading message while fetching', () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(
              () => new Promise(() => {}) // Never resolves
            ),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom

      render(<ReportRenderer reportKey="student-enrollment" />)

      expect(screen.getByText('Loading report...')).toBeInTheDocument()
    })

    it('should hide loading message after data is loaded', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      // Initially shows loading
      expect(screen.getByText('Loading report...')).toBeInTheDocument()

      // After data loads, loading message should be gone
      await waitFor(() => {
        expect(screen.queryByText('Loading report...')).not.toBeInTheDocument()
        expect(screen.getByText('Student Enrollment Report')).toBeInTheDocument()
      })
    })
  })

  describe('Schema Validation', () => {
    it('should handle schema with no columns', async () => {
      const schemaNoColumns = {
        ...mockSchema,
        schema: {
          ...mockSchema.schema,
          columns: [],
        },
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: schemaNoColumns,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      render(<ReportRenderer reportKey="student-enrollment" />)

      await waitFor(() => {
        expect(screen.getByText('Student Enrollment Report')).toBeInTheDocument()
      })

      // Should render table with no columns
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('should render report with minimal schema', async () => {
      const minimalSchema = {
        id: 'report-1',
        report_key: 'minimal',
        schema: {
          title: 'Minimal Report',
          query_function: 'generate-report',
          columns: [{ key: 'id', label: 'ID' }],
          empty_state_message: 'No data',
          export_formats: ['table'],
        },
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: minimalSchema,
              error: null,
            }),
          }),
        }),
      })

      supabaseModule.supabase.from = mockFrom
      supabaseModule.supabase.functions.invoke = vi.fn().mockResolvedValue({
        data: [{ id: '1' }, { id: '2' }],
        error: null,
      })

      render(<ReportRenderer reportKey="minimal" />)

      await waitFor(() => {
        expect(screen.getByText('Minimal Report')).toBeInTheDocument()
        expect(screen.getByText('ID')).toBeInTheDocument()
      })
    })
  })
})
