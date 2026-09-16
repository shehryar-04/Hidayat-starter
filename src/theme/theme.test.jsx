import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeProvider'
import { theme, colors } from './theme'

function ThemeConsumer() {
  const { mode, resolvedMode, isDark, toggleMode, setMode } = useTheme()
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolvedMode}</span>
      <span data-testid="isDark">{String(isDark)}</span>
      <button onClick={toggleMode}>Toggle</button>
      <button onClick={() => setMode('dark')}>SetDark</button>
      <button onClick={() => setMode('light')}>SetLight</button>
    </div>
  )
}

describe('Theme System', () => {
  it('exports valid theme tokens structure', () => {
    expect(colors.light.primary).toBeDefined()
    expect(colors.dark.primary).toBeDefined()
    expect(theme.typography.fontFamilies.sans).toBeDefined()
    expect(theme.spacing[4]).toBe('16px')
    expect(theme.radii.xl).toBe('0.75rem')
  })

  it('provides default light mode and handles toggling', () => {
    render(
      <ThemeProvider defaultMode="light">
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('mode').textContent).toBe('light')
    expect(screen.getByTestId('resolved').textContent).toBe('light')
    expect(screen.getByTestId('isDark').textContent).toBe('false')

    fireEvent.click(screen.getByText('Toggle'))
    expect(screen.getByTestId('mode').textContent).toBe('dark')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(screen.getByTestId('isDark').textContent).toBe('true')
  })

  it('explicitly switches modes via setMode', () => {
    render(
      <ThemeProvider defaultMode="light">
        <ThemeConsumer />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByText('SetDark'))
    expect(screen.getByTestId('mode').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    fireEvent.click(screen.getByText('SetLight'))
    expect(screen.getByTestId('mode').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
