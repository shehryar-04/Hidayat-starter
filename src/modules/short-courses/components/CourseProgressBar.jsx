import { motion } from 'framer-motion'

/**
 * CourseProgressBar — Animated progress bar with percentage label.
 * Used in StudentCourseView and StudentDashboard.
 */
export function CourseProgressBar({ percentage = 0, total = 0, completed = 0, size = 'md', showLabel = true }) {
  const pct = Math.min(100, Math.max(0, percentage))

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }
  const height = heights[size] || heights.md

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">
            {completed} / {total} lectures
          </span>
          <span className={`text-xs font-bold ${pct >= 100 ? 'text-green-600' : 'text-primary-600'}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
      )}
      <div className={`w-full ${height} bg-gray-100 rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
