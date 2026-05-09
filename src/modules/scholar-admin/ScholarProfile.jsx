import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const PROGRAMS = ['dars-e-nizami', 'hifz', 'nazra', 'short-courses']

export function ScholarProfile({ scholar, onBack, onDeactivate }) {
  const [subjectAssignments, setSubjectAssignments] = useState([])
  const [programAssignments, setProgramAssignments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const fullName = scholar.profiles?.full_name || 'Unknown'
  const isActive = scholar.employment_status === 'active'

  useEffect(() => {
    loadAssignments()
    loadSubjects()
  }, [scholar.id])

  const loadAssignments = async () => {
    const [{ data: sa }, { data: pa }] = await Promise.all([
      supabase.from('scholar_subject_assignments')
        .select('id, assigned_at, dars_e_nizami_subjects:subject_id(id, name, dars_e_nizami_levels:level_id(name))')
        .eq('scholar_id', scholar.id),
      supabase.from('scholar_program_assignments')
        .select('id, program, assigned_at')
        .eq('scholar_id', scholar.id),
    ])
    setSubjectAssignments(sa || [])
    setProgramAssignments(pa || [])
  }

  const loadSubjects = async () => {
    const { data } = await supabase
      .from('dars_e_nizami_subjects')
      .select('id, name, dars_e_nizami_levels:level_id(name)')
      .order('name')
    setSubjects(data || [])
  }

  const assignSubject = async () => {
    if (!selectedSubject) return
    setLoading(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('scholar_subject_assignments').insert({
        scholar_id: scholar.id, subject_id: selectedSubject, assigned_by: user.id,
      })
      if (err) throw err
      setSelectedSubject(''); await loadAssignments(); setMsg('Subject assigned.')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const assignProgram = async () => {
    if (!selectedProgram) return
    setLoading(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('scholar_program_assignments').insert({
        scholar_id: scholar.id, program: selectedProgram, assigned_by: user.id,
      })
      if (err) throw err
      setSelectedProgram(''); await loadAssignments(); setMsg('Program assigned.')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const removeSubjectAssignment = async (id) => {
    const { error: err } = await supabase.from('scholar_subject_assignments').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await loadAssignments()
  }

  const removeProgramAssignment = async (id) => {
    const { error: err } = await supabase.from('scholar_program_assignments').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await loadAssignments()
  }

  const handleDeactivate = async () => {
    setDeactivating(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('scholars').update({ employment_status: 'inactive' }).eq('id', scholar.id)
      await supabase.from('student_scholar_assignments')
        .update({ status: 'flagged_for_review', flagged_at: new Date().toISOString(), flagged_by: user.id })
        .eq('scholar_id', scholar.id).eq('status', 'active')
      onDeactivate()
    } catch (err) { setError(err.message) }
    finally { setDeactivating(false); setConfirmDeactivate(false) }
  }

  const initials = fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="page max-w-3xl">
      <button onClick={onBack} className="btn-ghost text-sm mb-4">← Back to Search</button>

      {error && <div className="alert-error mb-4 text-sm">{error}</div>}
      {msg && <div className="alert-success mb-4 text-sm">{msg}</div>}

      {/* ── Header card ── */}
      <div className="card mb-6 flex items-start gap-5">
        {scholar.profiles?.avatar_url ? (
          <img src={scholar.profiles.avatar_url} alt={fullName}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {scholar.title && <span className="text-sm text-secondary font-medium">{scholar.title}</span>}
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-primary-700 capitalize">
              {scholar.profiles?.role || 'scholar'}
            </span>
          </div>
          <h1 className="font-serif text-2xl text-primary font-bold">{fullName}</h1>
          {scholar.contact_info?.email && (
            <p className="text-sm text-gray-400 mt-0.5">{scholar.contact_info.email}</p>
          )}
        </div>
      </div>

      {/* ── Bio ── */}
      {scholar.bio && (
        <div className="card mb-6">
          <h3 className="mb-2">Biography</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{scholar.bio}</p>
        </div>
      )}

      {/* ── Qualifications & Specializations ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="mb-3">Qualifications</h3>
          {scholar.qualifications?.length > 0 ? (
            <ul className="space-y-1">
              {scholar.qualifications.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-secondary mt-0.5">✓</span>{q}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-400">None listed.</p>}
        </div>
        <div className="card">
          <h3 className="mb-3">Specializations</h3>
          {scholar.specializations?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {scholar.specializations.map(sp => (
                <span key={sp} className="text-xs bg-neutral-100 text-primary-700 px-3 py-1 rounded-full font-medium">{sp}</span>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">None listed.</p>}
        </div>
      </div>

      {/* ── Contact ── */}
      {scholar.contact_info && Object.keys(scholar.contact_info).length > 0 && (
        <div className="card mb-6">
          <h3 className="mb-3">Contact Information</h3>
          <div className="space-y-1 text-sm text-gray-600">
            {scholar.contact_info.email && <p>📧 {scholar.contact_info.email}</p>}
            {scholar.contact_info.phone && <p>📞 {scholar.contact_info.phone}</p>}
            {scholar.contact_info.address && <p>📍 {scholar.contact_info.address}</p>}
          </div>
        </div>
      )}

      {/* ── Subject assignments ── */}
      <div className="card mb-6">
        <h3 className="mb-4">Subject Assignments</h3>
        {subjectAssignments.length > 0 ? (
          <div className="space-y-2 mb-4">
            {subjectAssignments.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-2.5">
                <div>
                  <span className="text-sm font-medium text-gray-700">{a.dars_e_nizami_subjects?.name}</span>
                  {a.dars_e_nizami_subjects?.dars_e_nizami_levels?.name && (
                    <span className="text-xs text-gray-400 ml-2">({a.dars_e_nizami_subjects.dars_e_nizami_levels.name})</span>
                  )}
                  <span className="text-xs text-gray-400 ml-2">· {new Date(a.assigned_at).toLocaleDateString()}</span>
                </div>
                <button onClick={() => removeSubjectAssignment(a.id)} className="text-xs text-tertiary hover:underline">Remove</button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 mb-4">No subject assignments yet.</p>}

        <div className="flex gap-2">
          <select className="form-input flex-1" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            <option value="">Select a subject…</option>
            {subjects.filter(s => !subjectAssignments.some(a => a.dars_e_nizami_subjects?.id === s.id)).map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.dars_e_nizami_levels?.name})</option>
            ))}
          </select>
          <button onClick={assignSubject} disabled={loading || !selectedSubject} className="btn-secondary flex-shrink-0">
            Assign
          </button>
        </div>
      </div>

      {/* ── Program assignments ── */}
      <div className="card mb-6">
        <h3 className="mb-4">Program Assignments</h3>
        {programAssignments.length > 0 ? (
          <div className="space-y-2 mb-4">
            {programAssignments.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-2.5">
                <div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{a.program}</span>
                  <span className="text-xs text-gray-400 ml-2">· {new Date(a.assigned_at).toLocaleDateString()}</span>
                </div>
                <button onClick={() => removeProgramAssignment(a.id)} className="text-xs text-tertiary hover:underline">Remove</button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 mb-4">No program assignments yet.</p>}

        <div className="flex gap-2">
          <select className="form-input flex-1" value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}>
            <option value="">Select a program…</option>
            {PROGRAMS.filter(p => !programAssignments.some(a => a.program === p)).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button onClick={assignProgram} disabled={loading || !selectedProgram} className="btn-secondary flex-shrink-0">
            Assign
          </button>
        </div>
      </div>

      {/* ── Deactivation ── */}
      {isActive && (
        <div className="card border-tertiary-200">
          <h3 className="mb-2 text-tertiary">Deactivate Scholar</h3>
          <p className="text-sm text-gray-500 mb-4">
            Sets employment status to inactive and flags all active student assignments for admin review.
          </p>
          {!confirmDeactivate ? (
            <button onClick={() => setConfirmDeactivate(true)} className="btn-danger">
              Deactivate Scholar
            </button>
          ) : (
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 mb-3">
                Are you sure? This will deactivate <strong>{fullName}</strong> and flag all their active student assignments.
              </p>
              <div className="flex gap-3">
                <button onClick={handleDeactivate} disabled={deactivating} className="btn-danger">
                  {deactivating ? 'Deactivating…' : 'Confirm Deactivation'}
                </button>
                <button onClick={() => setConfirmDeactivate(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
