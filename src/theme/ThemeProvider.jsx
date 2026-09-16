import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { theme, colors } from './theme'

const ThemeContext = createContext({
  theme,
  mode: 'light',
  resolvedMode: 'light',
  isDark: false,
  setMode: () => {},
  toggleMode: () => {},
})

const STORAGE_KEY = 'hidayat_theme_mode'

export function ThemeProvider({ children, defaultMode = 'light' }) {
  const [mode, setModeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || defaultMode
    } catch {
      return defaultMode
    }
  })

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Listen to OS system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemDark(e.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [])

  const resolvedMode = useMemo(() => {
    if (mode === 'system') {
      return systemDark ? 'dark' : 'light'
    }
    return mode === 'dark' ? 'dark' : 'light'
  }, [mode, systemDark])

  const isDark = resolvedMode === 'dark'

  // Apply dark mode class and color tokens to documentElement
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [isDark])

  const setMode = useCallback((newMode) => {
    setModeState(newMode)
    try {
      localStorage.setItem(STORAGE_KEY, newMode)
    } catch {}
  }, [])

  const toggleMode = useCallback(() => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [setMode])

  const activeTheme = useMemo(() => ({
    ...theme,
    colors: isDark ? colors.dark : colors.light,
    isDark,
  }), [isDark])

  const value = useMemo(() => ({
    theme: activeTheme,
    mode,
    resolvedMode,
    isDark,
    setMode,
    toggleMode,
  }), [activeTheme, mode, resolvedMode, isDark, setMode, toggleMode])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme,
      mode: 'light',
      resolvedMode: 'light',
      isDark: false,
      setMode: () => {},
      toggleMode: () => {},
    }
  }
  return context
}

export default ThemeProvider
