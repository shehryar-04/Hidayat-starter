import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const LEVEL_COLORS = {
  Beginner: 'badge-green',
  Intermediate: 'badge-yellow',
  Advanced: 'badge-red',
  'All levels': 'badge-blue',
}

const STATUS_COLORS = {
  draft: 'badge-gray',
  pending_approval: 'badge-yellow',
  published: 'badge-green',
  archived: 'badge-red',
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

  if (loading) return <div className="loading">Loading courses…</div>

  return (
    <div className="page">
      {error && <div className="alert-error mb-4">{error}</div>}

      {courses.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-sm">No courses yet. Create your first course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(course => {
            const now = new Date()
            const start = course.start_date ? new Date(course.start_date) : null
            const end = course.end_date ? new Date(course.end_date) : null
            const timeStatus = !start ? null : start > now ? 'Upcoming' : end && end < now ? 'Ended' : 'Active'

            return (
              <div key={course.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="h-36 bg-neutral-100 flex items-center justify-center overflow-hidden">
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    : <span className="text-4xl">🎓</span>}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`badge ${STATUS_COLORS[course.status] || 'badge-gray'}`}>{course.status}</span>
                    {course.level && <span className={`badge ${LEVEL_COLORS[course.level] || 'badge-gray'}`}>{course.level}</span>}
                    {timeStatus && <span className="badge badge-blue">{timeStatus}</span>}
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
                    <button onClick={() => onSelectCourse(course)} className="btn-primary flex-1 text-xs py-1.5">
                      Enrollments
                    </button>
                    {onEditCourse && (
                      <button onClick={() => onEditCourse(course)} className="btn-outline text-xs py-1.5 px-3">
                        Edit
                      </button>
                    )}
                    <button onClick={() => handleDelete(course.id)} className="btn-danger text-xs py-1.5 px-3">
                      Delete
                    </button>
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
