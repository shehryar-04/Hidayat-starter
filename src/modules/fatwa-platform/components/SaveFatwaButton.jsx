import { Heart } from 'lucide-react'
import { cn } from '../../../shared/ui'

/**
 * SaveFatwaButton — Heart icon button to save/unsave a fatwa locally.
 * No login required. Uses localStorage via the useLocalSavedFatwas hook.
 */
export default function SaveFatwaButton({ isSaved, onToggle, size = 'md', className }) {
  const sizes = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  }
  const iconSizes = { sm: 16, md: 18, lg: 20 }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle() }}
      className={cn(
        'rounded-lg transition-all duration-200',
        isSaved
          ? 'text-red-500 bg-red-50 hover:bg-red-100'
          : 'text-gray-400 hover:text-red-400 hover:bg-gray-100',
        sizes[size],
        className
      )}
      title={isSaved ? 'Remove from saved' : 'Save this fatwa'}
      aria-label={isSaved ? 'Remove from saved fatwas' : 'Save this fatwa'}
    >
      <Heart size={iconSizes[size]} fill={isSaved ? 'currentColor' : 'none'} />
    </button>
  )
}
