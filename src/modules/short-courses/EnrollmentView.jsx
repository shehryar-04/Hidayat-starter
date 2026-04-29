import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  incomplete:'bg-red-100 text-red-700',
}

export function EnrollmentView({ course, onBack }) {
  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)

  // Enroll form
  const [showForm, setShowForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => { loadAll() }, [course.id])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [{ data: eData }, { data: sData }] = await Promise.all([
        supabase.from('short_course_enrollments')
          .select(`id, enrolled_at, payment_ref, status, completed_at,
                   students:student_id(id, enrollment_number, profiles:profile_id(full_name))`)
          .eq('course_id', course.id)
          .order('enrolled_at', { ascending: false }),
        supabase.from('students')
          .select('id, enrollment_number, profiles:profile_id(full_name)')
          .eq('status', 'active')
          .order('enrollment_number'),
      ])
      setEnrollments(eData || [])
      setStudents(sData || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleEnroll = async (e) => {
    e.preventDefault()
    if (!selectedStudent) return
    setEnrolling(true); setError(null)
    try {
      const { error: err } = await supabase.from('short_course_enrollments').insert({
        course_id: course.id,
        student_id: selectedStudent,
        enrolled_at: new Date().toISOString().split('T')[0],
        payment_ref: paymentRef || null,
        status: 'active',
      })
      if (err) throw err
      setSelectedStudent(''); setPaymentRef(''); setShowForm(false)
      setMsg('Student enrolled successfully.')
      await loadAll()
      setTimeout(() => setMsg(null), 3000)
    } catch (err) { setError(err.message) }
    finally { setEnrolling(false) }
  }

  const handleMarkComplete = async (id) => {
    try {
      const { error: err } = await supabase.from('short_course_enrollments')
        .update({ status: 'completed', completed_at: new Date().toISOString().split('T')[0] })
        .eq('id', id)
      if (err) throw err
      await loadAll()
    } catch (err) { setError(err.message) }
  }

  const handleApprove = async (id) => {
    try {
      const { error: err } = await supabase.from('short_course_enrollments')
        .update({ status: 'active' })
        .eq('id', id)
      if (err) throw err
      setMsg('Enrollment approved.')
      await loadAll()
      setTimeout(() => setMsg(null), 3000)
    } catch (err) { setError(err.message) }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this enrollment request?')) return
    const { error: err } = await supabase.from('short_course_enrollments').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await loadAll()
  }

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this enrollment?')) return
    const { error: err } = await supabase.from('short_course_enrollments').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await loadAll()
  }

  // Filter out already-enrolled students from the dropdown
  const enrolledStudentIds = new Set(enrollments.map(e => e.students?.id))
  const availableStudents = students.filter(s => !enrolledStudentIds.has(s.id))

  const activeCount = enrollments.filter(e => e.status === 'active').length
  const completedCount = enrollments.filter(e => e.status === 'completed').length

  return (
    <div className="page max-w-4xl">
      <button onClick={onBack} className="btn-ghost text-sm mb-4">← Back to Courses</button>

      {/* Course header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl text-primary font-bold mb-1">{course.title}</h1>
            <p className="text-sm text-gray-500">{course.subtitle || course.description?.slice(0, 100)}</p>
          </div>
          <div className="flex gap-3 text-center flex-shrink-0">
            <div className="bg-neutral-50 rounded-lg px-4 py-2">
              <div className="text-lg font-bold text-primary">{enrollments.length}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Total</div>
            </div>
            <div className="bg-green-50 rounded-lg px-4 py-2">
              <div className="text-lg font-bold text-green-700">{activeCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Active</div>
            </div>
            <div className="bg-blue-50 rounded-lg px-4 py-2">
              <div className="text-lg font-bold text-blue-700">{completedCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert-error mb-4 text-sm">{error}</div>}
      {msg && <div className="alert-success mb-4 text-sm">{msg}</div>}

      {/* Enroll button / form */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="btn-primary mb-6">+ Enroll Student</button>
      ) : (
        <div className="card mb-6">
          <h3 className="mb-4">Enroll a Student</h3>
          <form onSubmit={handleEnroll} className="flex flex-col sm:flex-row gap-3">
            <select className="form-input flex-1" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required>
              <option value="">Select student…</option>
              {availableStudents.map(s => (
                <option key={s.id} value={s.id}>{s.profiles?.full_name} ({s.enrollment_number})</option>
              ))}
            </select>
            <input className="form-input sm:w-48" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
              placeholder="Payment ref (optional)" />
            <button type="submit" disabled={enrolling || !selectedStudent} className="btn-primary flex-shrink-0">
              {enrolling ? 'Enrolling…' : 'Enroll'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-shrink-0">Cancel</button>
          </form>
        </div>
      )}

      {/* Enrollments table */}
      {loading ? (
        <div className="loading">Loading enrollments…</div>
      ) : enrollments.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm">No students enrolled yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Enrollment #</th>
                <th>Enrolled</th>
                <th>Payment Ref</th>
                <th>Status</th>
                <th>Completed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(e => (
                <tr key={e.id}>
                  <td className="font-medium">{e.students?.profiles?.full_name || '—'}</td>
                  <td className="text-gray-500 text-xs font-mono">{e.students?.enrollment_number || '—'}</td>
                  <td className="text-gray-500 text-xs">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                  <td className="text-gray-500 text-xs">{e.payment_ref || '—'}</td>
                  <td>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[e.status] || 'bg-gray-100 text-gray-600'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="text-gray-500 text-xs">{e.completed_at ? new Date(e.completed_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      {e.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(e.id)} className="bg-primary text-white text-xs py-1 px-3 rounded-lg font-bold hover:bg-primary-600">
                            ✓ Approve
                          </button>
                          <button onClick={() => handleReject(e.id)} className="text-xs text-tertiary hover:underline">
                            Reject
                          </button>
                        </>
                      )}
                      {e.status === 'active' && (
                        <button onClick={() => handleMarkComplete(e.id)} className="btn-outline text-xs py-1 px-2">
                          ✓ Complete
                        </button>
                      )}
                      <button onClick={() => handleRemove(e.id)} className="text-xs text-tertiary hover:underline">
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
