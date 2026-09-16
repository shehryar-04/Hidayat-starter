import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Card, CardContent } from './Card'
import { Skeleton } from './Skeleton'
import { cn } from './utils'

/**
 * Standard KPI / Stat Card for Dashboards and Reports
 *
 * @param {object} props
 * @param {string} props.title - Card label
 * @param {string|number} props.value - Primary stat value
 * @param {React.ComponentType} [props.icon] - Lucide icon component
 * @param {object} [props.trend] - Trend data: { value: '+12%', isPositive: true, label: 'vs last month' }
 * @param {string} [props.subtitle] - Secondary supporting text
 * @param {boolean} [props.loading=false] - Shows skeleton placeholder
 * @param {React.ReactNode} [props.action] - Optional top right action
 * @param {string} [props.className] - Custom container classes
 * @param {function} [props.onClick] - Makes card interactive
 */
export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  loading = false,
  action,
  className,
  onClick,
  ...props
}) {
  if (loading) {
    return (
      <Card className={cn('p-5', className)}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </Card>
    )
  }

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={cn('p-5 overflow-hidden', className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
          {title}
        </span>
        {action ? (
          <div>{action}</div>
        ) : Icon ? (
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-primary-100/60 dark:border-emerald-900/30">
            <Icon className="w-5 h-5" />
          </div>
        ) : null}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md',
              trend.isPositive === true
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                : trend.isPositive === false
                ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
            )}
          >
            {trend.isPositive === true ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : trend.isPositive === false ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {(subtitle || trend?.label) && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {trend?.label || subtitle}
        </p>
      )}
    </Card>
  )
}

export default KpiCard
