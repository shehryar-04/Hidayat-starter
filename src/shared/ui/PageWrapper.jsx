import { cn } from './utils'

/**
 * Standardized page layout wrapper providing consistent padding and max-width.
 * @param {object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Page content
 * @example
 * <PageWrapper>
 *   <PageHeader title="Dashboard" />
 *   <div>Content here</div>
 * </PageWrapper>
 */
export function PageWrapper({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
