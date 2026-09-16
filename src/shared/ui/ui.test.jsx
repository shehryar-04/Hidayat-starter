import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  Button,
  Input,
  FormField,
  SearchInput,
  Modal,
  ConfirmDialog,
  KpiCard,
  Pagination,
  useModal,
} from './index'

function ModalConsumer() {
  const { isOpen, openModal, closeModal, data } = useModal()
  return (
    <div>
      <button onClick={() => openModal({ name: 'Test Entity' })}>Open Modal</button>
      <Modal open={isOpen} onClose={closeModal} title="Test Title" description="Test Description">
        <p data-testid="modal-content">Modal Data: {data?.name}</p>
        <button onClick={closeModal}>Close Inside</button>
      </Modal>
    </div>
  )
}

describe('Shared UI Components System', () => {
  it('renders Button with variants and loading spinner', () => {
    const { rerender } = render(<Button variant="primary">Click Me</Button>)
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument()

    rerender(<Button loading>Loading...</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders FormField with label, required asterisk, and error', () => {
    render(
      <FormField label="Email Address" required error="Invalid email address">
        <Input placeholder="user@example.com" />
      </FormField>
    )

    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument()
  })

  it('renders SearchInput with clear button', () => {
    const onClear = vi.fn()
    render(<SearchInput value="test query" onChange={() => {}} onClear={onClear} />)

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument()
    const clearBtn = screen.getByLabelText('Clear search')
    fireEvent.click(clearBtn)
    expect(onClear).toHaveBeenCalled()
  })

  it('manages modal lifecycle with useModal', async () => {
    render(<ModalConsumer />)

    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Open Modal'))
    expect(screen.getByTestId('modal-content')).toBeInTheDocument()
    expect(screen.getByText('Modal Data: Test Entity')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Close Inside'))
    const { waitFor } = await import('@testing-library/react')
    await waitFor(() => {
      expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()
    })
  })

  it('renders ConfirmDialog and triggers confirmation', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        title="Delete Item"
        message="Are you sure you want to delete this?"
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmText="Yes, Delete"
        variant="danger"
      />
    )

    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this?')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Yes, Delete'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('renders KpiCard with title, value, and trend', () => {
    render(
      <KpiCard
        title="Total Enrollments"
        value="1,420"
        trend={{ value: '+14%', isPositive: true, label: 'vs last month' }}
      />
    )

    expect(screen.getByText('Total Enrollments')).toBeInTheDocument()
    expect(screen.getByText('1,420')).toBeInTheDocument()
    expect(screen.getByText('+14%')).toBeInTheDocument()
  })

  it('renders Pagination controls and triggers page change', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    )

    expect(screen.getByText(/Showing/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})
