import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BreadcrumbNav from './BreadcrumbNav'

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('BreadcrumbNav', () => {
  const sampleItems = [
    { name: 'Home', url: '/fatwas' },
    { name: 'Worship', url: '/fatwas/category/worship' },
    { name: 'Prayer', url: '/fatwas/category/worship/prayer' },
    { name: 'Missed Prayers', url: '/fatwas/category/worship/prayer/missed-prayers' },
    { name: 'Ruling on Qada Prayers', url: '/fatwas/ruling-on-qada-prayers' },
  ]

  it('renders a nav element with aria-label="Breadcrumb"', () => {
    renderWithRouter(<BreadcrumbNav items={sampleItems} />)
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav).toBeInTheDocument()
  })

  it('renders an ordered list with list items', () => {
    renderWithRouter(<BreadcrumbNav items={sampleItems} />)
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(sampleItems.length)
  })

  it('renders all items except the last as links', () => {
    renderWithRouter(<BreadcrumbNav items={sampleItems} />)
    const links = screen.getAllByRole('link')
    // All items except the last should be links
    expect(links).toHaveLength(sampleItems.length - 1)
    expect(links[0]).toHaveTextContent('Home')
    expect(links[1]).toHaveTextContent('Worship')
    expect(links[2]).toHaveTextContent('Prayer')
    expect(links[3]).toHaveTextContent('Missed Prayers')
  })

  it('renders the last item as plain text with aria-current="page"', () => {
    renderWithRouter(<BreadcrumbNav items={sampleItems} />)
    const currentPage = screen.getByText('Ruling on Qada Prayers')
    expect(currentPage).toHaveAttribute('aria-current', 'page')
    expect(currentPage.tagName).not.toBe('A')
  })

  it('links point to the correct URLs', () => {
    renderWithRouter(<BreadcrumbNav items={sampleItems} />)
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/fatwas')
    expect(links[1]).toHaveAttribute('href', '/fatwas/category/worship')
    expect(links[2]).toHaveAttribute('href', '/fatwas/category/worship/prayer')
    expect(links[3]).toHaveAttribute('href', '/fatwas/category/worship/prayer/missed-prayers')
  })

  it('renders separator characters between items', () => {
    const { container } = renderWithRouter(<BreadcrumbNav items={sampleItems} />)
    const separators = container.querySelectorAll('[aria-hidden="true"]')
    // Separators between items (items.length - 1)
    expect(separators).toHaveLength(sampleItems.length - 1)
  })

  it('renders BreadcrumbList JSON-LD structured data', () => {
    const { container } = renderWithRouter(<BreadcrumbNav items={sampleItems} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()

    const jsonLd = JSON.parse(script.innerHTML)
    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('BreadcrumbList')
    expect(jsonLd.itemListElement).toHaveLength(sampleItems.length)
    expect(jsonLd.itemListElement[0].position).toBe(1)
    expect(jsonLd.itemListElement[0].name).toBe('Home')
    expect(jsonLd.itemListElement[0].item).toBe('/fatwas')
    expect(jsonLd.itemListElement[4].position).toBe(5)
    expect(jsonLd.itemListElement[4].name).toBe('Ruling on Qada Prayers')
  })

  it('returns null when items is empty', () => {
    const { container } = renderWithRouter(<BreadcrumbNav items={[]} />)
    expect(container.querySelector('nav')).not.toBeInTheDocument()
  })

  it('returns null when items is undefined', () => {
    const { container } = renderWithRouter(<BreadcrumbNav items={undefined} />)
    expect(container.querySelector('nav')).not.toBeInTheDocument()
  })

  it('handles a single item (renders as current page, no links)', () => {
    const singleItem = [{ name: 'Home', url: '/fatwas' }]
    renderWithRouter(<BreadcrumbNav items={singleItem} />)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.getByText('Home')).toHaveAttribute('aria-current', 'page')
  })
})
