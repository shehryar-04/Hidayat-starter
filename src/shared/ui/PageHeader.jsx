import { cn } from './utils'

/**
 * Standardized page header with title, optional subtitle, and action buttons.
 * @param {object} props
 * @param {string} props.title - Page title (max 80 chars)
 * @param {string} [props.subtitle] - Optional subtitle (max 200 chars)
 * @param {React.ReactNode} [props.actions] - Optional action buttons aligned right
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <PageHeader
 *   title="Student Administration"
 *   subtitle="Manage student records and enrollments"
 *   actions={<Button>Add Student</Button>}
 * />
 */
export function PageHeader({ title, subtitle, actions, className, ...props }) {
  return (
    <div
      className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6', className)}
      {...props}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
          {title?.slice(0, 80)}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">
            {subtitle?.slice(0, 200)}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  )
}
