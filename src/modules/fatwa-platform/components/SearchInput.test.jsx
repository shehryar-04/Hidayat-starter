import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SearchInput from './SearchInput'

const mockSuggestions = [
  { title: 'Prayer in congregation', slug: 'prayer-in-congregation', id: '1' },
  { title: 'Prayer times', slug: 'prayer-times', id: '2' },
  { title: 'Prayer for the deceased', slug: 'prayer-for-deceased', id: '3' },
  { title: 'Fasting rules', slug: 'fasting-rules', id: '4' },
  { title: 'Zakat calculation', slug: 'zakat-calculation', id: '5' },
]

describe('SearchInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    suggestions: [],
    onSelect: vi.fn(),
  }

  it('renders the input with placeholder', () => {
    render(<SearchInput {...defaultProps} placeholder="Search fatwas..." />)
    expect(screen.getByPlaceholderText('Search fatwas...')).toBeInTheDocument()
  })

  it('calls onChange when user types', () => {
    const onChange = vi.fn()
    render(<SearchInput {...defaultProps} onChange={onChange} />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'prayer' } })
    expect(onChange).toHaveBeenCalledWith('prayer')
  })

  it('shows dropdown when input is focused and suggestions exist', () => {
    render(
      <SearchInput {...defaultProps} value="pray" suggestions={mockSuggestions} />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(5)
  })

  it('does not show dropdown when suggestions are empty', () => {
    render(<SearchInput {...defaultProps} value="xyz" suggestions={[]} />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('highlights matching text in suggestions', () => {
    render(
      <SearchInput {...defaultProps} value="Prayer" suggestions={mockSuggestions} />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    // The matching portion should be wrapped in <strong>
    const strongElements = document.querySelectorAll('strong')
    expect(strongElements.length).toBeGreaterThan(0)
    expect(strongElements[0].textContent).toBe('Prayer')
  })

  it('navigates suggestions with ArrowDown key', () => {
    render(
      <SearchInput {...defaultProps} value="pray" suggestions={mockSuggestions} />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('navigates suggestions with ArrowUp key', () => {
    render(
      <SearchInput {...defaultProps} value="pray" suggestions={mockSuggestions} />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('wraps around when navigating past last suggestion', () => {
    const twoSuggestions = mockSuggestions.slice(0, 2)
    render(
      <SearchInput {...defaultProps} value="pray" suggestions={twoSuggestions} />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' }) // wraps to first

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('selects suggestion on Enter key', () => {
    const onSelect = vi.fn()
    render(
      <SearchInput
        {...defaultProps}
        value="pray"
        suggestions={mockSuggestions}
        onSelect={onSelect}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith(mockSuggestions[0])
  })

  it('closes dropdown on Escape key', async () => {
    render(
      <SearchInput {...defaultProps} value="pray" suggestions={mockSuggestions} />
    )

    const input = screen.getByRole('combobox')
    
    await act(async () => {
      fireEvent.focus(input)
    })
    
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Escape' })
    })
    
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('selects suggestion on mouse click', () => {
    const onSelect = vi.fn()
    render(
      <SearchInput
        {...defaultProps}
        value="pray"
        suggestions={mockSuggestions}
        onSelect={onSelect}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    const options = screen.getAllByRole('option')
    fireEvent.mouseDown(options[2])

    expect(onSelect).toHaveBeenCalledWith(mockSuggestions[2])
  })

  it('has correct ARIA attributes', () => {
    render(
      <SearchInput {...defaultProps} value="pray" suggestions={mockSuggestions} />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-controls', 'search-suggestions-listbox')
  })

  it('sets aria-activedescendant when navigating', () => {
    render(
      <SearchInput {...defaultProps} value="pray" suggestions={mockSuggestions} />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(input).toHaveAttribute('aria-activedescendant', 'search-option-0')
  })

  it('shows loading spinner when isSearching is true', () => {
    render(<SearchInput {...defaultProps} isSearching={true} />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('does not show loading spinner when isSearching is false', () => {
    render(<SearchInput {...defaultProps} isSearching={false} />)
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument()
  })

  it('suggestion items have minimum 44px touch target', () => {
    render(
      <SearchInput {...defaultProps} value="pray" suggestions={mockSuggestions} />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    const options = screen.getAllByRole('option')
    options.forEach((option) => {
      expect(option.className).toContain('min-h-[44px]')
    })
  })

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <SearchInput {...defaultProps} value="pray" suggestions={mockSuggestions} />
      </div>
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
