import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function BulkStudentUpdate({ onComplete }) {
  const [studentIds, setStudentIds] = useState('')
  const [operation, setOperation] = useState('status')
  const [newStatus, setNewStatus] = useState('active')
  const [newProgram, setNewProgram] = useState('')
  const [newLevel, setNewLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [levels, setLevels] = useState([])
  const programs = ['dars-e-nizami', 'hifz', 'nazra', 'short-courses']

  useEffect(() => {
    supabase.from('dars_e_nizami_levels').select('id, name').order('sequence_order')
      .then(({ data }) => { if (data) setLevels(data) })
  }, [])

  const ids = studentIds.split('\n').map(s => s.trim()).filter(Boolean)

  const handleSubmit = async () => {
    if (ids.length === 0) { setMsg({ type: 'error', text: 'Enter at least one student ID.' }); return }
    setLoading(true); setMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-student-update`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: ids, operation, ...(operation === 'status' ? { new_status: newStatus } : { new_program: newProgram, new_level: newLevel }) }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      setMsg({ type: 'success', text: `Updated ${ids.length} student(s) successfully.` })
      setStudentIds('')
      onComplete?.()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setLoading(false) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Bulk Student Update</h1>
        <p className="page-subtitle">Apply status or program changes to multiple students at once.</p>
      </div>

      <div className="card max-w-xl">
        {msg && <div className={`${msg.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>{msg.text}</div>}

        <div className="form-group">
          <label className="form-label">Operation</label>
          <select className="form-input" value={operation} onChange={e => setOperation(e.target.value)}>
            <option value="status">Change Status</option>
            <option value="program">Assign Program</option>
          </select>
        </div>

        {operation === 'status' && (
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select className="form-input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="graduated">Graduated</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        )}

        {operation === 'program' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Program</label>
              <select className="form-input" value={newProgram} onChange={e => setNewProgram(e.target.value)}>
                <option value="">Select…</option>
                {programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Level</label>
              <select className="form-input" value={newLevel} onChange={e => setNewLevel(e.target.value)}>
                <option value="">Select…</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Student IDs <span className="text-gray-400 font-normal">(one per line — {ids.length} entered)</span></label>
          <textarea className="form-input font-mono text-xs" rows={6} value={studentIds} onChange={e => setStudentIds(e.target.value)} placeholder="Paste student UUIDs here, one per line…" />
        </div>

        <button onClick={handleSubmit} disabled={loading || ids.length === 0} className="btn-primary w-full">
          {loading ? 'Processing…' : `Apply to ${ids.length} Student${ids.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
