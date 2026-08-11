import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver which is missing in JSDOM test environment
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

global.IntersectionObserver = MockIntersectionObserver
window.IntersectionObserver = MockIntersectionObserver
