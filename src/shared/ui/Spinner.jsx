import { cn } from './utils'
import { Loader2 } from 'lucide-react'

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }

/**
 * Loading spinner with size variants.
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Spinner size (16px, 24px, 32px)
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <Spinner size="lg" />
 */
export function Spinner({ size = 'md', className }) {
  return <Loader2 className={cn('animate-spin text-primary-500', sizeMap[size], className)} />
}
