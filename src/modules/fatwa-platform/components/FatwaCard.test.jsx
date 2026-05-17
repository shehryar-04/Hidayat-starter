import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { FatwaCard } from './FatwaCard'

function renderCard(fatwaOverrides = {}) {
  const fatwa = {
    title: 'Ruling on Missed Prayers',
    slug: 'ruling-on-missed-prayers',
    reference_number: 'HDF-2024-001',
    category_1: 'عبادات / Worship',
    dar_ul_ifta: 'Hidayat Darul Ifta',
    ...fatwaOverrides,
  }

  return render(
    <BrowserRouter>
      <FatwaCard fatwa={fatwa} />
    </BrowserRouter>
  )
}

describe('FatwaCard', () => {
  it('renders the fatwa title as an h3 heading', () => {
    renderCard()
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Ruling on Missed Prayers')
  })

  it('renders the reference number as a badge', () => {
    renderCard()
    expect(screen.getByText('#HDF-2024-001')).toBeInTheDocument()
  })

  it('renders the category tag', () => {
    renderCard()
    expect(screen.getByText('عبادات / Worship')).toBeInTheDocument()
  })

  it('renders the dar_ul_ifta text', () => {
    renderCard()
    expect(screen.getByText('Hidayat Darul Ifta')).toBeInTheDocument()
  })

  it('links to the fatwa detail page using the slug', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/fatwas/ruling-on-missed-prayers')
  })

  it('applies hover animation classes for scale and shadow transition', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link.className).toContain('hover:scale-[1.02]')
    expect(link.className).toContain('hover:shadow-lg')
    expect(link.className).toContain('duration-150')
  })

  it('has focus-visible ring for accessibility', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link.className).toContain('focus-visible:ring-2')
  })

  it('handles missing category gracefully', () => {
    renderCard({ category_1: '' })
    // Should not render an empty category tag
    expect(screen.queryByText('عبادات / Worship')).not.toBeInTheDocument()
  })

  it('handles missing dar_ul_ifta gracefully', () => {
    renderCard({ dar_ul_ifta: '' })
    expect(screen.queryByText('Hidayat Darul Ifta')).not.toBeInTheDocument()
  })
})
