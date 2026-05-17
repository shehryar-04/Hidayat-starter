import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReadingProgress } from './useReadingProgress'

describe('useReadingProgress', () => {
  let scrollListeners = []
  let resizeListeners = []

  beforeEach(() => {
    scrollListeners = []
    resizeListeners = []

    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'scroll') scrollListeners.push(handler)
      if (event === 'resize') resizeListeners.push(handler)
    })

    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})

    // Mock requestAnimationFrame to execute immediately
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb()
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 0 when no ref is provided', () => {
    const { result } = renderHook(() => useReadingProgress(null))
    expect(result.current).toBe(0)
  })

  it('returns 0 when ref.current is null', () => {
    const ref = { current: null }
    const { result } = renderHook(() => useReadingProgress(ref))
    expect(result.current).toBe(0)
  })

  it('returns 100 when content is shorter than viewport', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

    const ref = {
      current: {
        getBoundingClientRect: () => ({ top: 100 }),
        offsetHeight: 400,
      },
    }

    const { result } = renderHook(() => useReadingProgress(ref))
    expect(result.current).toBe(100)
  })

  it('returns 0 when at the top of content', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

    const ref = {
      current: {
        getBoundingClientRect: () => ({ top: 100 }),
        offsetHeight: 2000,
      },
    }

    const { result } = renderHook(() => useReadingProgress(ref))
    // scrollTop (0) - contentTop (0 + 100) = -100, clamped to 0
    expect(result.current).toBe(0)
  })

  it('returns 100 when scrolled to the bottom of content', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 1300, writable: true })

    const ref = {
      current: {
        getBoundingClientRect: () => ({ top: -1200 }),
        offsetHeight: 2000,
      },
    }

    const { result } = renderHook(() => useReadingProgress(ref))
    // contentTop = -1200 + 1300 = 100
    // scrollableDistance = 2000 - 800 = 1200
    // scrolledPast = 1300 - 100 = 1200
    // percentage = (1200 / 1200) * 100 = 100
    expect(result.current).toBe(100)
  })

  it('returns approximately 50 when scrolled halfway through content', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 700, writable: true })

    const ref = {
      current: {
        getBoundingClientRect: () => ({ top: -600 }),
        offsetHeight: 2000,
      },
    }

    const { result } = renderHook(() => useReadingProgress(ref))
    // contentTop = -600 + 700 = 100
    // scrollableDistance = 2000 - 800 = 1200
    // scrolledPast = 700 - 100 = 600
    // percentage = (600 / 1200) * 100 = 50
    expect(result.current).toBe(50)
  })

  it('updates progress on scroll events', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

    const ref = {
      current: {
        getBoundingClientRect: () => ({ top: 100 - window.scrollY }),
        offsetHeight: 2000,
      },
    }

    const { result } = renderHook(() => useReadingProgress(ref))
    expect(result.current).toBe(0)

    // Simulate scrolling
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 700, writable: true })
      scrollListeners.forEach((listener) => listener())
    })

    // contentTop = (100 - 700) + 700 = 100
    // scrolledPast = 700 - 100 = 600
    // scrollableDistance = 2000 - 800 = 1200
    // percentage = (600 / 1200) * 100 = 50
    expect(result.current).toBe(50)
  })

  it('cleans up event listeners on unmount', () => {
    const ref = { current: null }
    const { unmount } = renderHook(() => useReadingProgress(ref))

    unmount()

    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('never returns a value below 0', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

    const ref = {
      current: {
        getBoundingClientRect: () => ({ top: 500 }),
        offsetHeight: 2000,
      },
    }

    const { result } = renderHook(() => useReadingProgress(ref))
    // contentTop = 500 + 0 = 500
    // scrolledPast = 0 - 500 = -500, clamped to 0
    expect(result.current).toBe(0)
  })

  it('never returns a value above 100', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 5000, writable: true })

    const ref = {
      current: {
        getBoundingClientRect: () => ({ top: -4900 }),
        offsetHeight: 2000,
      },
    }

    const { result } = renderHook(() => useReadingProgress(ref))
    // contentTop = -4900 + 5000 = 100
    // scrollableDistance = 2000 - 800 = 1200
    // scrolledPast = 5000 - 100 = 4900
    // percentage = (4900 / 1200) * 100 = 408, clamped to 100
    expect(result.current).toBe(100)
  })
})
