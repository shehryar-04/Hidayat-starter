import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Users, Calendar, Globe, Tag, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button, Badge, Spinner, EmptyState, ConfirmDialog } from '../../shared/ui'

const STATUS_VARIANT = {
  draft: 'default',
  pending_approval: 'warning',
  published: 'success',
  archived: 'error',
}

const LEVEL_VARIANT = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'error',
  'All levels': 'info',
}

export function CourseList({ onSelectCourse, onEditCourse }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { loadCourses() }, [])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('short_courses')
        .select(`id, title, subtitle, description, thumbnail_url, level, status,
                 category, language, is_free, fee, start_date, end_date,
                 learning_objectives, tags,
                 profiles:created_by(full_name)`)
        .order('created_at', { ascending: false })
      if (err) throw err
      setCourses(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    const { error: err } = await supabase.from('short_courses').delete().eq('id', deleteTargetId)
    setDeleting(false)
    if (err) { setError(err.message); return }
    setCourses(c => c.filter(x => x.id !== deleteTargetId))
    setDeleteTargetId(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" />
        <span className="text-sm text-neutral-400 mt-3 font-medium">Loading courses...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-12">
          <EmptyState
            icon={GraduationCap}
            title="No courses yet"
            description="Create your first interactive Islamic short course to get started."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => {
            const now = new Date()
            const start = course.start_date ? new Date(course.start_date) : null
            const end = course.end_date ? new Date(course.end_date) : null
            const timeStatus = !start ? null : start > now ? 'Upcoming' : end && end < now ? 'Ended' : 'Active'

            return (
              <div
                key={course.id}
                className="group bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] shadow-xs hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
              >
                {/* Thumbnail Header */}
                <div className="relative h-44 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-[#112018] dark:to-[#09140e] flex items-center justify-center overflow-hidden border-b border-neutral-100 dark:border-[#1a2e23]">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-neutral-200/50 dark:border-white/10 flex items-center justify-center text-3xl shadow-sm">
                      🎓
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="backdrop-blur-md bg-white/90 dark:bg-[#0f1a14]/90 px-2.5 py-1 rounded-full text-[11px] font-bold text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-[#1a2e23] shadow-xs">
                      {course.is_free ? 'Free' : `$${course.fee ?? '0'}`}
                    </span>
                    <Badge variant={STATUS_VARIANT[course.status] || 'default'} dot>
                      <span className="capitalize">{course.status?.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Category & Level */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    {course.level && (
                      <Badge variant={LEVEL_VARIANT[course.level] || 'default'}>
                        {course.level}
                      </Badge>
                    )}
                    {course.category && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#14221b] text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-[#1a2e23]">
                        {course.category}
                      </span>
                    )}
                    {timeStatus && (
                      <Badge variant={timeStatus === 'Active' ? 'success' : 'info'}>
                        {timeStatus}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-neutral-900 dark:text-neutral-50 text-base leading-snug mb-1.5 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors">
                    {course.title}
                  </h3>

                  {course.subtitle && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2.5 line-clamp-1">
                      {course.subtitle}
                    </p>
                  )}

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 flex-1 leading-relaxed">
                    {course.description || 'No description provided.'}
                  </p>

                  {/* Metadata Row */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-[#1a2e23] flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{course.language || 'Urdu / English'}</span>
                    </div>
                    {course.profiles?.full_name && (
                      <div className="flex items-center gap-1 truncate max-w-[120px]">
                        <span className="text-neutral-400">By</span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                          {course.profiles.full_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-2 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => onSelectCourse(course)}
                    >
                      Manage Course
                    </Button>
                    {onEditCourse && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditCourse(course)}
                        title="Edit course details"
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTargetId(course.id)}
                      title="Delete course"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Course"
        message="Are you sure you want to delete this course? All modules, quizzes, and enrollments associated with it will be permanently removed."
        confirmText="Delete Course"
        variant="danger"
      />
    </div>
  )
}
