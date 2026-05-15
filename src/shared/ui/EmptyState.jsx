import { motion } from 'framer-motion'
import { cn } from './utils'

/**
 * Empty state display with icon, title, description, and optional action.
 * @param {object} props
 * @param {React.ComponentType} [props.icon] - Lucide icon component
 * @param {string} [props.title] - Empty state heading (max 60 chars)
 * @param {string} [props.description] - Explanatory text (max 150 chars)
 * @param {React.ReactNode} [props.action] - Optional action button
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <EmptyState icon={FileText} title="No documents" description="Upload your first document to get started." action={<Button>Upload</Button>} />
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <motion.div
      className={cn('flex flex-col items-center justify-center py-16 text-center', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      role="status"
    >
      {Icon && <Icon className="w-12 h-12 text-neutral-300 mb-4" strokeWidth={1.5} />}
      {title && <h3 className="text-lg font-semibold text-neutral-700 mb-1">{title}</h3>}
      {description && <p className="text-sm text-neutral-500 max-w-sm mb-6">{description}</p>}
      {action && action}
    </motion.div>
  )
}
