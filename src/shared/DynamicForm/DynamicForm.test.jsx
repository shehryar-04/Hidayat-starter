import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DynamicForm } from './DynamicForm'

describe('DynamicForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  describe('Field Rendering', () => {
    it('should render text field correctly', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: 'text',
            required: false,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByPlaceholderText('Full Name')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should render number field correctly', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'age',
            label: 'Age',
            type: 'number',
            required: false,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByPlaceholderText('Age')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should render date field correctly', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'birthDate',
            label: 'Date of Birth',
            type: 'date',
            required: false,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByLabelText('Date of Birth')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'date')
    })

    it('should render select field correctly', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'program',
            label: 'Program',
            type: 'select',
            required: false,
            options: [
              { value: 'dars', label: 'Dars-e-Nizami' },
              { value: 'hifz', label: 'Hifz' },
            ],
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const select = screen.getByLabelText('Program')
      expect(select).toBeInTheDocument()
      expect(screen.getByText('Dars-e-Nizami')).toBeInTheDocument()
      expect(screen.getByText('Hifz')).toBeInTheDocument()
    })

    it('should render multi-select field correctly', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'subjects',
            label: 'Subjects',
            type: 'multi-select',
            required: false,
            options: [
              { value: 'fiqh', label: 'Fiqh' },
              { value: 'hadith', label: 'Hadith' },
              { value: 'tafsir', label: 'Tafsir' },
            ],
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const select = screen.getByLabelText('Subjects')
      expect(select).toBeInTheDocument()
      expect(select).toHaveAttribute('multiple')
    })

    it('should render file upload field correctly', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'document',
            label: 'Upload Document',
            type: 'file',
            required: false,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByLabelText('Upload Document')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'file')
    })

    it('should render textarea field correctly', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'comments',
            label: 'Comments',
            type: 'textarea',
            required: false,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const textarea = screen.getByLabelText('Comments')
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should render boolean toggle field correctly', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'agree',
            label: 'I Agree',
            type: 'boolean',
            required: false,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const checkbox = screen.getByLabelText('I Agree')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).toHaveAttribute('type', 'checkbox')
    })

    it('should display required indicator for required fields', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: 'text',
            required: true,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const requiredIndicator = screen.getByText('*')
      expect(requiredIndicator).toBeInTheDocument()
    })
  })

  describe('Required Field Validation', () => {
    it('should show error for empty required text field on submit', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: 'text',
            required: true,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Full Name is required')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error for empty required number field on submit', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'age',
            label: 'Age',
            type: 'number',
            required: true,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Age is required')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error for empty required select field on submit', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'program',
            label: 'Program',
            type: 'select',
            required: true,
            options: [
              { value: 'dars', label: 'Dars-e-Nizami' },
            ],
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Program is required')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should not show error for filled required field on submit', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: 'text',
            required: true,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByPlaceholderText('Full Name')
      await userEvent.type(input, 'John Doe')

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          data: { name: 'John Doe' },
          schemaVersion: 1,
        })
      })
    })

    it('should clear error when user starts typing', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: 'text',
            required: true,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Full Name is required')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Full Name')
      await userEvent.type(input, 'J')

      await waitFor(() => {
        expect(screen.queryByText('Full Name is required')).not.toBeInTheDocument()
      })
    })
  })

  describe('Field Validation Rules', () => {
    it('should validate number field min constraint', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'age',
            label: 'Age',
            type: 'number',
            required: true,
            validation: { min: 18 },
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByPlaceholderText('Age')
      await userEvent.type(input, '15')

      const submitButton = screen.getByText('Submit')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Age must be at least 18')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate number field max constraint', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'score',
            label: 'Score',
            type: 'number',
            required: true,
            validation: { max: 100 },
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByPlaceholderText('Score')
      await userEvent.type(input, '150')

      const submitButton = screen.getByText('Submit')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Score must be at most 100')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate text field pattern constraint', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'email',
            label: 'Email',
            type: 'text',
            required: true,
            validation: {
              pattern: '^[^@]+@[^@]+\\.[^@]+$',
              message: 'Please enter a valid email',
            },
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByPlaceholderText('Email')
      await userEvent.type(input, 'invalid-email')

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should pass validation with valid pattern', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'email',
            label: 'Email',
            type: 'text',
            required: true,
            validation: {
              pattern: '^[^@]+@[^@]+\\.[^@]+$',
              message: 'Please enter a valid email',
            },
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByPlaceholderText('Email')
      await userEvent.type(input, 'test@example.com')

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          data: { email: 'test@example.com' },
          schemaVersion: 1,
        })
      })
    })
  })

  describe('Conditional Field Visibility', () => {
    it('should hide field when visibleWhen condition is not met', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'program',
            label: 'Program',
            type: 'select',
            required: false,
            options: [
              { value: 'dars', label: 'Dars-e-Nizami' },
              { value: 'hifz', label: 'Hifz' },
            ],
          },
          {
            key: 'level',
            label: 'Level',
            type: 'select',
            required: false,
            visibleWhen: { field: 'program', equals: 'dars' },
            options: [
              { value: '1', label: 'Level 1' },
              { value: '2', label: 'Level 2' },
            ],
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      // Level field should not be visible initially
      expect(screen.queryByLabelText('Level')).not.toBeInTheDocument()
    })

    it('should show field when visibleWhen condition is met', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'program',
            label: 'Program',
            type: 'select',
            required: false,
            options: [
              { value: 'dars', label: 'Dars-e-Nizami' },
              { value: 'hifz', label: 'Hifz' },
            ],
          },
          {
            key: 'level',
            label: 'Level',
            type: 'select',
            required: false,
            visibleWhen: { field: 'program', equals: 'dars' },
            options: [
              { value: '1', label: 'Level 1' },
              { value: '2', label: 'Level 2' },
            ],
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const programSelect = screen.getByLabelText('Program')
      await userEvent.selectOptions(programSelect, 'dars')

      await waitFor(() => {
        expect(screen.getByLabelText('Level')).toBeInTheDocument()
      })
    })

    it('should hide field again when condition becomes false', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'program',
            label: 'Program',
            type: 'select',
            required: false,
            options: [
              { value: 'dars', label: 'Dars-e-Nizami' },
              { value: 'hifz', label: 'Hifz' },
            ],
          },
          {
            key: 'level',
            label: 'Level',
            type: 'select',
            required: false,
            visibleWhen: { field: 'program', equals: 'dars' },
            options: [
              { value: '1', label: 'Level 1' },
              { value: '2', label: 'Level 2' },
            ],
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const programSelect = screen.getByLabelText('Program')
      
      // Show the field
      await userEvent.selectOptions(programSelect, 'dars')
      await waitFor(() => {
        expect(screen.getByLabelText('Level')).toBeInTheDocument()
      })

      // Hide the field
      await userEvent.selectOptions(programSelect, 'hifz')
      await waitFor(() => {
        expect(screen.queryByLabelText('Level')).not.toBeInTheDocument()
      })
    })

    it('should not include hidden fields in form submission', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'program',
            label: 'Program',
            type: 'select',
            required: false,
            options: [
              { value: 'dars', label: 'Dars-e-Nizami' },
              { value: 'hifz', label: 'Hifz' },
            ],
          },
          {
            key: 'level',
            label: 'Level',
            type: 'select',
            required: false,
            visibleWhen: { field: 'program', equals: 'dars' },
            options: [
              { value: '1', label: 'Level 1' },
              { value: '2', label: 'Level 2' },
            ],
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const programSelect = screen.getByLabelText('Program')
      await userEvent.selectOptions(programSelect, 'hifz')

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          data: { program: 'hifz' },
          schemaVersion: 1,
        })
      })

      // level should not be in the submission
      expect(mockOnSubmit.mock.calls[0][0].data).not.toHaveProperty('level')
    })
  })

  describe('Schema Version Tracking', () => {
    it('should include schema version in submission payload', async () => {
      const schema = {
        id: 'test-form',
        version: 3,
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: 'text',
            required: true,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByPlaceholderText('Full Name')
      await userEvent.type(input, 'John Doe')

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          data: { name: 'John Doe' },
          schemaVersion: 3,
        })
      })
    })
  })

  describe('Initial Values', () => {
    it('should populate form with initial values', () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: 'text',
            required: false,
          },
          {
            key: 'age',
            label: 'Age',
            type: 'number',
            required: false,
          },
        ],
      }

      const initialValues = {
        name: 'John Doe',
        age: 30,
      }

      render(
        <DynamicForm
          schema={schema}
          onSubmit={mockOnSubmit}
          initialValues={initialValues}
        />
      )

      const nameInput = screen.getByPlaceholderText('Full Name')
      const ageInput = screen.getByPlaceholderText('Age')

      expect(nameInput).toHaveValue('John Doe')
      expect(ageInput).toHaveValue(30)
    })
  })

  describe('Multi-Select Field', () => {
    it('should handle multi-select value changes', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'subjects',
            label: 'Subjects',
            type: 'multi-select',
            required: false,
            options: [
              { value: 'fiqh', label: 'Fiqh' },
              { value: 'hadith', label: 'Hadith' },
              { value: 'tafsir', label: 'Tafsir' },
            ],
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const select = screen.getByLabelText('Subjects')
      await userEvent.selectOptions(select, ['fiqh', 'hadith'])

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          data: { subjects: ['fiqh', 'hadith'] },
          schemaVersion: 1,
        })
      })
    })
  })

  describe('File Upload Field', () => {
    it('should handle file upload', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'document',
            label: 'Upload Document',
            type: 'file',
            required: false,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const input = screen.getByLabelText('Upload Document')
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })

      await userEvent.upload(input, file)

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
        const callData = mockOnSubmit.mock.calls[0][0].data
        expect(callData.document).toEqual(file)
      })
    })
  })

  describe('Boolean Field', () => {
    it('should handle boolean checkbox toggle', async () => {
      const schema = {
        id: 'test-form',
        version: 1,
        fields: [
          {
            key: 'agree',
            label: 'I Agree',
            type: 'boolean',
            required: false,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      const checkbox = screen.getByLabelText('I Agree')
      expect(checkbox).not.toBeChecked()

      await userEvent.click(checkbox)
      expect(checkbox).toBeChecked()

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          data: { agree: true },
          schemaVersion: 1,
        })
      })
    })
  })

  describe('Complex Form Scenarios', () => {
    it('should handle form with multiple field types and validation', async () => {
      const schema = {
        id: 'test-form',
        version: 2,
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: 'text',
            required: true,
          },
          {
            key: 'email',
            label: 'Email',
            type: 'text',
            required: true,
            validation: {
              pattern: '^[^@]+@[^@]+\\.[^@]+$',
              message: 'Invalid email',
            },
          },
          {
            key: 'age',
            label: 'Age',
            type: 'number',
            required: true,
            validation: { min: 18, max: 100 },
          },
          {
            key: 'program',
            label: 'Program',
            type: 'select',
            required: true,
            options: [
              { value: 'dars', label: 'Dars-e-Nizami' },
              { value: 'hifz', label: 'Hifz' },
            ],
          },
          {
            key: 'level',
            label: 'Level',
            type: 'select',
            required: false,
            visibleWhen: { field: 'program', equals: 'dars' },
            options: [
              { value: '1', label: 'Level 1' },
              { value: '2', label: 'Level 2' },
            ],
          },
          {
            key: 'agree',
            label: 'I Agree to Terms',
            type: 'boolean',
            required: true,
          },
        ],
      }

      render(<DynamicForm schema={schema} onSubmit={mockOnSubmit} />)

      // Fill in all fields
      await userEvent.type(screen.getByPlaceholderText('Full Name'), 'John Doe')
      await userEvent.type(screen.getByPlaceholderText('Email'), 'john@example.com')
      await userEvent.type(screen.getByPlaceholderText('Age'), '25')
      const programSelect = screen.getByDisplayValue('Select Program')
      await userEvent.selectOptions(programSelect, 'dars')

      // Wait for level field to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Level')).toBeInTheDocument()
      })

      await userEvent.selectOptions(screen.getByDisplayValue('Select Level'), '1')
      await userEvent.click(screen.getByRole('checkbox'))

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          data: {
            name: 'John Doe',
            email: 'john@example.com',
            age: '25',
            program: 'dars',
            level: '1',
            agree: true,
          },
          schemaVersion: 2,
        })
      })
    })
  })
})
