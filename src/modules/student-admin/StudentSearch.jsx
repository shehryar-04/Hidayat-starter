import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function StudentSearch({ onSelectStudent }) {
  const [searchParams, setSearchParams] = useState({ name: '', enrollmentNumber: '', program: '', level: '', status: 'active' })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [levels, setLevels] = useState([])
  const programs = ['dars-e-nizami', 'hifz', 'nazra', 'short-courses']

  useEffect(() => {
    supabase.from('dars_e_nizami_levels').select('id, name').order('sequence_order')
      .then(({ data }) => { if (data) setLevels(data) })
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let query = supabase.from('students').select('id, enrollment_number, profile_id, status, enrollment_date')
      if (searchParams.enrollmentNumber) query = query.ilike('enrollment_number', `${searchParams.enrollmentNumber}%`)
      if (searchParams.status) query = query.eq('status', searchParams.status)
      const { data: students, error } = await query.limit(100)
      if (error) throw error
      if (students?.length > 0) {
        const profileIds = students.map(s => s.profile_id).filter(Boolean)
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', profileIds)
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]))
        let filtered = students.map(s => ({ ...s, full_name: profileMap[s.profile_id] || 'Unknown' }))
        if (searchParams.name) filtered = filtered.filter(s => s.full_name.toLowerCase().includes(searchParams.name.toLowerCase()))
        setResults(filtered)
      } else setResults([])
    } catch (err) { console.error(err); setResults([]) }
    finally { setLoading(false) }
  }

  const set = (key, val) => setSearchParams(p => ({ ...p, [key]: val }))

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Search Students</h1>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" value={searchParams.name} onChange={e => set('name', e.target.value)} placeholder="Search by name…" />
            </div>
            <div className="form-group">
              <label className="form-label">Enrollment Number</label>
              <input className="form-input" type="text" value={searchParams.enrollmentNumber} onChange={e => set('enrollmentNumber', e.target.value)} placeholder="Search by enrollment number…" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="form-group">
              <label className="form-label">Program</label>
              <select className="form-input" value={searchParams.program} onChange={e => set('program', e.target.value)}>
                <option value="">All Programs</option>
                {programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Academic Level</label>
              <select className="form-input" value={searchParams.level} onChange={e => set('level', e.target.value)}>
                <option value="">All Levels</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={searchParams.status} onChange={e => set('status', e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="graduated">Graduated</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Searching…' : 'Search'}</button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Results ({results.length})</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Name</th><th>Enrollment #</th><th>Status</th><th>Enrolled</th><th></th></tr></thead>
              <tbody>
                {results.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.full_name}</td>
                    <td className="text-gray-500">{s.enrollment_number}</td>
                    <td><span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'suspended' ? 'badge-red' : 'badge-gray'}`}>{s.status}</span></td>
                    <td className="text-gray-500">{s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString() : '—'}</td>
                    <td><button onClick={() => onSelectStudent(s)} className="btn-outline text-xs py-1 px-3">View / Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && searchParams.enrollmentNumber && (
        <div className="text-center py-10 text-gray-400 text-sm">No students found matching your criteria.</div>
      )}
    </div>
  )
}
