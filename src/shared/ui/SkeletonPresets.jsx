import { Skeleton } from './Skeleton'

/**
 * Reusable skeleton presets for consistent loading states.
 * Replace bare <Spinner> with these for a faster-feeling UI.
 */

/** Single course card skeleton (matches CourseCard layout) */
export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/** Grid of course card skeletons */
export function CourseGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Single list row skeleton (matches fatwa/question list items) */
export function ListRowSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

/** List of row skeletons */
export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  )
}

/** Table skeleton with header + rows */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} className="px-4 py-3 flex gap-4">
            {Array.from({ length: cols }).map((_, ci) => (
              <Skeleton key={ci} className={`h-3 flex-1 ${ci === 0 ? 'w-8 flex-none' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Stats card row skeleton (matches StudentDashboard stat cards) */
export function StatCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Dashboard skeleton (stats + course grid) */
export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Stats */}
      <StatCardsSkeleton />
      {/* Continue card */}
      <Skeleton className="h-24 w-full rounded-xl" />
      {/* Course grid */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <CourseGridSkeleton count={3} />
      </div>
    </div>
  )
}

/** Profile / detail page skeleton */
export function DetailPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  )
}

/** Search results skeleton (matches fatwa search results) */
export function SearchResultsSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-4/5 mb-2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4 mt-1" />
        </div>
      ))}
    </div>
  )
}
