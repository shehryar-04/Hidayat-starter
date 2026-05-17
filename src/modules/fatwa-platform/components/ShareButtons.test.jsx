import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ShareButtons from './ShareButtons'

describe('ShareButtons', () => {
  const defaultProps = {
    url: 'https://hidayat.org/fatwas/prayer-ruling',
    title: 'Ruling on Missed Prayers'
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders three share buttons', () => {
    render(<ShareButtons {...defaultProps} />)

    expect(screen.getByLabelText('Copy link')).toBeInTheDocument()
    expect(screen.getByLabelText('Share on WhatsApp')).toBeInTheDocument()
    expect(screen.getByLabelText('Share on Twitter')).toBeInTheDocument()
  })

  it('all buttons have minimum 44x44px touch targets', () => {
    render(<ShareButtons {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button.className).toContain('min-w-[44px]')
      expect(button.className).toContain('min-h-[44px]')
    })
  })

  it('copies URL to clipboard and shows feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<ShareButtons {...defaultProps} />)

    fireEvent.click(screen.getByLabelText('Copy link'))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(defaultProps.url)
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Link copied')).toBeInTheDocument()
    })
  })

  it('opens WhatsApp share with correct URL', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<ShareButtons {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Share on WhatsApp'))

    const expectedText = encodeURIComponent(`${defaultProps.title} ${defaultProps.url}`)
    expect(openSpy).toHaveBeenCalledWith(
      `https://wa.me/?text=${expectedText}`,
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('opens Twitter share with correct URL and text', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<ShareButtons {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Share on Twitter'))

    const expectedText = encodeURIComponent(defaultProps.title)
    const expectedUrl = encodeURIComponent(defaultProps.url)
    expect(openSpy).toHaveBeenCalledWith(
      `https://twitter.com/intent/tweet?text=${expectedText}&url=${expectedUrl}`,
      '_blank',
      'noopener,noreferrer'
    )
  })
})
