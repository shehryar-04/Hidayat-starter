import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { StudentCourseView } from './StudentCourseView'

const LEVEL_COLORS = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
  'All levels': 'bg-blue-100 text-blue-700',
}

export function AdminCourseReview() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [previewing, setPreviewing] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('short_courses')
        .select(`id, title, subtitle, description, thumbnail_url, level, status,
                 category, language, is_free, fee, learning_objectives, tags,
                 promo_video_url, requirements,
                 profiles:created_by(full_name)`)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })
      if (err) throw err
      setCourses(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleApprove = async (courseId) => {
    try {
      const { error: err } = await supabase
        .from('short_courses')
        .update({ status: 'published' })
        .eq('id', courseId)
      if (err) throw err
      setCourses(c => c.filter(x => x.id !== courseId))
      setPreviewing(null)
      setMsg('Course approved and published.')
      setTimeout(() => setMsg(null), 3000)
    } catch (err) { setError(err.message) }
  }

  const handleReject = async (courseId) => {
    if (!window.confirm('Reject this course? It will be moved back to draft.')) return
    try {
      const { error: err } = await supabase
        .from('short_courses')
        .update({ status: 'draft' })
        .eq('id', courseId)
      if (err) throw err
      setCourses(c => c.filter(x => x.id !== courseId))
      setPreviewing(null)
      setMsg('Course rejected and moved to draft.')
      setTimeout(() => setMsg(null), 3000)
    } catch (err) { setError(err.message) }
  }

  // Preview mode — show the course like a student would see it, with approve/reject buttons
  if (previewing) {
    return (
      <div>
        {/* Approval bar */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-yellow-600 text-sm font-bold">⏳ Pending Approval</span>
            <span className="text-sm text-gray-600">by {previewing.profiles?.full_name || 'Unknown'}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleApprove(previewing.id)} className="btn-primary text-sm py-1.5 px-4">
              ✓ Approve & Publish
            </button>
            <button onClick={() => handleReject(previewing.id)} className="btn-danger text-sm py-1.5 px-4">
              ✕ Reject
            </button>
            <button onClick={() => setPreviewing(null)} className="btn-ghost text-sm py-1.5 px-4">
              ← Back to Queue
            </button>
          </div>
        </div>
        {/* Render the student course view for preview */}
        <StudentCourseView course={previewing} onBack={() => setPreviewing(null)} />
      </div>
    )
  }

  if (loading) return <div className="loading">Loading pending courses…</div>

  return (
    <div className="page">
      {error && <div className="alert-error mb-4 text-sm">{error}</div>}
      {msg && <div className="alert-success mb-4 text-sm">{msg}</div>}

      {courses.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm">No courses pending approval. All clear!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-2">{courses.length} course{courses.length !== 1 ? 's' : ''} awaiting your review.</p>

          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden flex flex-col sm:flex-row">
              {/* Thumbnail */}
              <div className="sm:w-48 h-36 sm:h-auto bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {course.thumbnail_url
                  ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center"><span className="text-4xl">🎓</span></div>}
              </div>

              {/* Details */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pending Approval</span>
                  {course.level && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[course.level] || 'bg-gray-100 text-gray-600'}`}>{course.level}</span>}
                  {course.category && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-primary-700">{course.category}</span>}
                </div>

                <h3 className="font-semibold text-gray-800 text-sm mb-1">{course.title}</h3>
                {course.subtitle && <p className="text-xs text-gray-500 mb-1">{course.subtitle}</p>}
                <p className="text-xs text-gray-400 line-clamp-2 flex-1">{course.description}</p>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Submitted by: <span className="font-medium text-gray-600">{course.profiles?.full_name || 'Unknown'}</span>
                  </span>
                  <span className={`text-sm font-bold ${course.is_free ? 'text-secondary' : 'text-primary'}`}>
                    {course.is_free ? 'Free' : `$${course.fee}`}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setPreviewing(course)} className="btn-outline flex-1 text-xs py-1.5">
                    👁 Preview Course
                  </button>
                  <button onClick={() => handleApprove(course.id)} className="btn-primary text-xs py-1.5 px-4">
                    ✓ Approve
                  </button>
                  <button onClick={() => handleReject(course.id)} className="btn-danger text-xs py-1.5 px-4">
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
