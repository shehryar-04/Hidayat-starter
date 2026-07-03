import { Bookmark } from 'lucide-react'
import { cn } from '../../../shared/ui'

/**
 * BookmarkButton — Toggle bookmark for a fatwa.
 */
export default function BookmarkButton({ isBookmarked, onToggle, className }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle() }}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        isBookmarked
          ? 'text-primary bg-primary/10 hover:bg-primary/20'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
        className
      )}
      title={isBookmarked ? 'Remove bookmark' : 'Save fatwa'}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this fatwa'}
    >
      <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
    </button>
  )
}
