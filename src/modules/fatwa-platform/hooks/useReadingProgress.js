import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook that tracks scroll position relative to a content area
 * and returns the percentage read (0-100).
 *
 * @param {React.RefObject} contentRef - React ref to the content container element
 * @returns {number} percentage read (0-100)
 */
export function useReadingProgress(contentRef) {
  const [progress, setProgress] = useState(0)

  const calculateProgress = useCallback(() => {
    if (!contentRef || !contentRef.current) {
      return
    }

    const contentElement = contentRef.current
    const rect = contentElement.getBoundingClientRect()
    const contentTop = rect.top + window.scrollY
    const contentHeight = contentElement.offsetHeight
    const viewportHeight = window.innerHeight
    const scrollTop = window.scrollY

    // If content is shorter than viewport, it's fully visible
    if (contentHeight <= viewportHeight) {
      setProgress(100)
      return
    }

    const scrollableDistance = contentHeight - viewportHeight
    const scrolledPast = scrollTop - contentTop

    const percentage = Math.min(
      100,
      Math.max(0, (scrolledPast / scrollableDistance) * 100)
    )

    setProgress(Math.round(percentage))
  }, [contentRef])

  useEffect(() => {
    let rafId = null

    const handleScroll = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(calculateProgress)
    }

    // Calculate initial progress
    calculateProgress()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [calculateProgress])

  return progress
}
