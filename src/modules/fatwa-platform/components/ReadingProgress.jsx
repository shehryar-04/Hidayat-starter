import { useReadingProgress } from '../hooks/useReadingProgress'

/**
 * ReadingProgress - Fixed top progress bar showing percentage read.
 *
 * @param {{ contentRef: React.RefObject }} props
 * @returns {JSX.Element|null}
 */
export default function ReadingProgress({ contentRef }) {
  const progress = useReadingProgress(contentRef)

  if (progress <= 0) {
    return null
  }

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-green-600 z-50 transition-all duration-150"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    />
  )
}
