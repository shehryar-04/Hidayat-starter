import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import CategorySidebar from './CategorySidebar'

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

const sampleCategories = {
  'عبادات / Worship': {
    name: 'عبادات / Worship',
    slug: 'worship',
    count: 45,
    children: {
      'نماز / Prayer': {
        name: 'نماز / Prayer',
        slug: 'prayer',
        count: 20,
        children: {
          'قضا نماز / Missed Prayers': {
            name: 'قضا نماز / Missed Prayers',
            slug: 'missed-prayers',
            count: 8,
            children: {},
          },
          'جماعت / Congregation': {
            name: 'جماعت / Congregation',
            slug: 'congregation',
            count: 12,
            children: {},
          },
        },
      },
      'روزہ / Fasting': {
        name: 'روزہ / Fasting',
        slug: 'fasting',
        count: 25,
        children: {},
      },
    },
  },
  'معاملات / Transactions': {
    name: 'معاملات / Transactions',
    slug: 'transactions',
    count: 30,
    children: {},
  },
}

describe('CategorySidebar', () => {
  it('renders null when categories is empty', () => {
    const { container } = renderWithRouter(
      <CategorySidebar categories={{}} currentPath={[]} onNavigate={() => {}} />
    )
    expect(container.querySelector('aside')).not.toBeInTheDocument()
  })

  it('renders null when categories is null', () => {
    const { container } = renderWithRouter(
      <CategorySidebar categories={null} currentPath={[]} onNavigate={() => {}} />
    )
    expect(container.querySelector('aside')).not.toBeInTheDocument()
  })

  it('renders desktop sidebar with aria-label', () => {
    renderWithRouter(
      <CategorySidebar categories={sampleCategories} currentPath={[]} onNavigate={() => {}} />
    )
    const sidebar = screen.getAllByLabelText('Category navigation')[0]
    expect(sidebar).toBeInTheDocument()
  })

  it('renders top-level categories with counts', () => {
    renderWithRouter(
      <CategorySidebar categories={sampleCategories} currentPath={[]} onNavigate={() => {}} />
    )
    expect(screen.getAllByText('عبادات / Worship').length).toBeGreaterThan(0)
    expect(screen.getAllByText('معاملات / Transactions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('45').length).toBeGreaterThan(0)
    expect(screen.getAllByText('30').length).toBeGreaterThan(0)
  })

  it('expands a category when the expand button is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <CategorySidebar categories={sampleCategories} currentPath={[]} onNavigate={() => {}} />
    )

    // Initially, child categories should not be visible (not expanded)
    expect(screen.queryByText('نماز / Prayer')).not.toBeInTheDocument()

    // Click expand button for Worship
    const expandBtn = screen.getAllByLabelText('Expand عبادات / Worship')[0]
    await user.click(expandBtn)

    // Now child categories should be visible
    expect(screen.getAllByText('نماز / Prayer').length).toBeGreaterThan(0)
    expect(screen.getAllByText('روزہ / Fasting').length).toBeGreaterThan(0)
  })

  it('collapses a category when the collapse button is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <CategorySidebar
        categories={sampleCategories}
        currentPath={['worship']}
        onNavigate={() => {}}
      />
    )

    // Should be auto-expanded because it's in currentPath
    expect(screen.getAllByText('نماز / Prayer').length).toBeGreaterThan(0)

    // Click collapse button
    const collapseBtn = screen.getAllByLabelText('Collapse عبادات / Worship')[0]
    await user.click(collapseBtn)

    // Children should be hidden
    expect(screen.queryByText('نماز / Prayer')).not.toBeInTheDocument()
  })

  it('highlights the active category based on currentPath', () => {
    renderWithRouter(
      <CategorySidebar
        categories={sampleCategories}
        currentPath={['worship']}
        onNavigate={() => {}}
      />
    )

    // The active category link should have aria-current="page"
    const activeLink = screen.getAllByText('عبادات / Worship')[0].closest('a')
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  it('generates correct category URLs', () => {
    renderWithRouter(
      <CategorySidebar
        categories={sampleCategories}
        currentPath={['worship', 'prayer']}
        onNavigate={() => {}}
      />
    )

    // Top-level link
    const worshipLinks = screen.getAllByText('عبادات / Worship')
    const worshipLink = worshipLinks[0].closest('a')
    expect(worshipLink).toHaveAttribute('href', '/fatwas/category/worship')

    // Second-level link (auto-expanded because in currentPath)
    const prayerLinks = screen.getAllByText('نماز / Prayer')
    const prayerLink = prayerLinks[0].closest('a')
    expect(prayerLink).toHaveAttribute('href', '/fatwas/category/worship/prayer')
  })

  it('calls onNavigate with the correct path when a category is clicked', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    renderWithRouter(
      <CategorySidebar
        categories={sampleCategories}
        currentPath={[]}
        onNavigate={onNavigate}
      />
    )

    const transactionsLink = screen.getAllByText('معاملات / Transactions')[0].closest('a')
    await user.click(transactionsLink)

    expect(onNavigate).toHaveBeenCalledWith(['transactions'])
  })

  it('renders mobile toggle button', () => {
    renderWithRouter(
      <CategorySidebar categories={sampleCategories} currentPath={[]} onNavigate={() => {}} />
    )
    const toggleBtn = screen.getByRole('button', { name: /browse categories/i })
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens mobile menu when toggle is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <CategorySidebar categories={sampleCategories} currentPath={[]} onNavigate={() => {}} />
    )

    const toggleBtn = screen.getByRole('button', { name: /browse categories/i })
    await user.click(toggleBtn)

    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
    const mobileNav = document.getElementById('mobile-category-menu')
    expect(mobileNav).toBeInTheDocument()
  })

  it('has keyboard-accessible expand/collapse buttons with focus-visible ring', () => {
    renderWithRouter(
      <CategorySidebar categories={sampleCategories} currentPath={[]} onNavigate={() => {}} />
    )

    const expandBtns = screen.getAllByLabelText(/Expand/)
    expandBtns.forEach((btn) => {
      expect(btn.className).toContain('focus-visible:ring-2')
    })
  })

  it('displays count badges at every level', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <CategorySidebar
        categories={sampleCategories}
        currentPath={['worship', 'prayer']}
        onNavigate={() => {}}
      />
    )

    // Top-level count
    expect(screen.getAllByText('45').length).toBeGreaterThan(0)
    // Second-level count (auto-expanded)
    expect(screen.getAllByText('20').length).toBeGreaterThan(0)
    expect(screen.getAllByText('25').length).toBeGreaterThan(0)
  })
})
