import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Badge, Spinner, EmptyState } from '../../shared/ui'
import { GraduationCap } from 'lucide-react'

const LEVEL_COLORS = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
  'All levels': 'bg-blue-100 text-blue-700',
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-red-100 text-red-700',
}

export function CourseList({ onSelectCourse, onEditCourse }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return
    const { error: err } = await supabase.from('short_courses').delete().eq('id', id)
    if (err) { setError(err.message); return }
    setCourses(c => c.filter(x => x.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8">
      {error && <div className="bg-error-light text-error-dark rounded-lg p-4 text-sm mb-4">{error}</div>}

      {courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet"
          description="Create your first course to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(course => {
            const now = new Date()
            const start = course.start_date ? new Date(course.start_date) : null
            const end = course.end_date ? new Date(course.end_date) : null
            const timeStatus = !start ? null : start > now ? 'Upcoming' : end && end < now ? 'Ended' : 'Active'

            return (
              <div key={course.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="h-36 bg-neutral-100 flex items-center justify-center overflow-hidden">
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    : <span className="text-4xl">🎓</span>}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[course.status] || 'bg-gray-100 text-gray-600'}`}>{course.status}</span>
                    {course.level && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[course.level] || 'bg-gray-100 text-gray-600'}`}>{course.level}</span>}
                    {timeStatus && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{timeStatus}</span>}
                  </div>

                  <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1 line-clamp-2">{course.title}</h3>
                  {course.subtitle && <p className="text-xs text-gray-500 mb-2 line-clamp-1">{course.subtitle}</p>}

                  <p className="text-xs text-gray-400 line-clamp-2 flex-1">{course.description}</p>

                  {/* Meta */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>{course.is_free ? '🆓 Free' : `💳 $${course.fee ?? '—'}`}</span>
                    <span>{course.language}</span>
                    {course.profiles?.full_name && <span className="truncate max-w-[80px]">{course.profiles.full_name}</span>}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => onSelectCourse(course)}>
                      Manage
                    </Button>
                    {onEditCourse && (
                      <Button variant="outline" size="sm" onClick={() => onEditCourse(course)}>
                        Edit
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(course.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
