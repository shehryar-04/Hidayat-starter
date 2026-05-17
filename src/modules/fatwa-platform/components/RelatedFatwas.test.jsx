import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { RelatedFatwas } from './RelatedFatwas'

function makeFatwa(index) {
  return {
    title: `Fatwa Title ${index}`,
    slug: `fatwa-title-${index}`,
    reference_number: `HDF-2024-00${index}`,
    category_1: 'عبادات / Worship',
    dar_ul_ifta: 'Hidayat Darul Ifta',
  }
}

function renderComponent(fatwas) {
  return render(
    <BrowserRouter>
      <RelatedFatwas fatwas={fatwas} />
    </BrowserRouter>
  )
}

describe('RelatedFatwas', () => {
  it('returns null when fatwas array is empty', () => {
    const { container } = renderComponent([])
    expect(container.innerHTML).toBe('')
  })

  it('returns null when fatwas is undefined', () => {
    const { container } = render(
      <BrowserRouter>
        <RelatedFatwas />
      </BrowserRouter>
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders the "Related Fatwas" heading', () => {
    renderComponent([makeFatwa(1)])
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Related Fatwas')
  })

  it('renders fatwa cards for each item', () => {
    const fatwas = [makeFatwa(1), makeFatwa(2), makeFatwa(3)]
    renderComponent(fatwas)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
  })

  it('displays a maximum of 6 fatwa cards', () => {
    const fatwas = Array.from({ length: 8 }, (_, i) => makeFatwa(i + 1))
    renderComponent(fatwas)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(6)
  })

  it('each card links to the correct fatwa detail page', () => {
    renderComponent([makeFatwa(1)])
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/fatwas/fatwa-title-1')
  })

  it('renders in a responsive grid layout', () => {
    renderComponent([makeFatwa(1)])
    const grid = screen.getByRole('heading', { level: 2 }).parentElement.querySelector('.grid')
    expect(grid.className).toContain('grid-cols-1')
    expect(grid.className).toContain('md:grid-cols-2')
    expect(grid.className).toContain('lg:grid-cols-3')
  })

  it('uses a section element with aria-labelledby', () => {
    renderComponent([makeFatwa(1)])
    const section = screen.getByRole('region', { name: 'Related Fatwas' })
    expect(section).toBeInTheDocument()
  })
})
