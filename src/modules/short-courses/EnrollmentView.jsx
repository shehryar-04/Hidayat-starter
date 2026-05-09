import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../app/RoleProvider'

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  incomplete:'bg-red-100 text-red-700',
}

const PAYMENT_STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  verified: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

export function EnrollmentView({ course, onBack }) {
  const { userId } = useRole()
  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [invoices, setInvoices] = useState({}) // keyed by enrollment_id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)

  // Enroll form
  const [showForm, setShowForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  // Rejection modal
  const [rejectingInvoice, setRejectingInvoice] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => { loadAll() }, [course.id])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [{ data: eData }, { data: sData }, { data: invData }] = await Promise.all([
        supabase.from('short_course_enrollments')
          .select(`id, enrolled_at, payment_ref, status, completed_at,
                   students:student_id(id, enrollment_number, profiles:profile_id(full_name))`)
          .eq('course_id', course.id)
          .order('enrolled_at', { ascending: false }),
        supabase.from('students')
          .select('id, enrollment_number, profiles:profile_id(full_name)')
          .eq('status', 'active')
          .order('enrollment_number'),
        supabase.from('payment_invoices')
          .select('*')
          .eq('course_id', course.id)
          .order('submitted_at', { ascending: false }),
      ])
      setEnrollments(eData || [])
      setStudents(sData || [])

      // Index invoices by enrollment_id (latest one per enrollment)
      const invMap = {}
      for (const inv of (invData || [])) {
        if (!invMap[inv.enrollment_id]) {
          invMap[inv.enrollment_id] = inv
        }
      }
      setInvoices(invMap)
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
      // Approve enrollment
      const { error: err } = await supabase.from('short_course_enrollments')
        .update({ status: 'active' })
        .eq('id', id)
      if (err) throw err

      // If there's a payment invoice, mark it as verified
      const inv = invoices[id]
      if (inv && inv.status === 'pending') {
        await supabase.from('payment_invoices')
          .update({ status: 'verified', reviewed_at: new Date().toISOString(), reviewed_by: userId })
          .eq('id', inv.id)
      }

      setMsg('Enrollment approved and payment verified.')
      await loadAll()
      setTimeout(() => setMsg(null), 3000)
    } catch (err) { setError(err.message) }
  }

  const handleRejectPayment = async () => {
    if (!rejectingInvoice) return
    try {
      // Update invoice status to rejected
      await supabase.from('payment_invoices')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
          rejection_reason: rejectionReason || 'Payment could not be verified.',
        })
        .eq('id', rejectingInvoice.id)

      // Delete the enrollment so student can retry
      await supabase.from('short_course_enrollments')
        .delete()
        .eq('id', rejectingInvoice.enrollment_id)

      setRejectingInvoice(null)
      setRejectionReason('')
      setMsg('Payment rejected. Student can resubmit.')
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
                <th>Payment</th>
                <th>Status</th>
                <th>Completed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(e => {
                const inv = invoices[e.id]
                return (
                  <tr key={e.id}>
                    <td className="font-medium">{e.students?.profiles?.full_name || '—'}</td>
                    <td className="text-gray-500 text-xs font-mono">{e.students?.enrollment_number || '—'}</td>
                    <td className="text-gray-500 text-xs">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                    <td>
                      {inv ? (
                        <div className="space-y-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_STYLES[inv.status]}`}>
                            {inv.status === 'pending' ? '⏳ Pending' : inv.status === 'verified' ? '✓ Verified' : '✗ Rejected'}
                          </span>
                          <div className="text-[10px] text-gray-500">
                            <span className="capitalize">{inv.payment_method}</span> · TXN: <span className="font-mono">{inv.transaction_id}</span>
                          </div>
                          <div className="text-[10px] text-gray-400">Rs. {inv.amount} · {inv.invoice_number}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{e.payment_ref || '—'}</span>
                      )}
                    </td>
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
                            {inv ? (
                              <button onClick={() => { setRejectingInvoice(inv); setRejectionReason('') }}
                                className="text-xs text-tertiary hover:underline">
                                Reject Payment
                              </button>
                            ) : (
                              <button onClick={() => handleReject(e.id)} className="text-xs text-tertiary hover:underline">
                                Reject
                              </button>
                            )}
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Rejection reason modal */}
      {rejectingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Reject Payment</h3>
            <p className="text-sm text-gray-500">
              Invoice: <span className="font-mono">{rejectingInvoice.invoice_number}</span><br />
              TXN: <span className="font-mono">{rejectingInvoice.transaction_id}</span> · Rs. {rejectingInvoice.amount}
            </p>
            <div>
              <label className="form-label text-sm">Reason for rejection</label>
              <textarea
                className="form-input w-full"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Transaction ID not found, amount mismatch…"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectingInvoice(null)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleRejectPayment} className="bg-red-600 text-white text-sm py-2 px-4 rounded-lg font-bold hover:bg-red-700">
                Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
