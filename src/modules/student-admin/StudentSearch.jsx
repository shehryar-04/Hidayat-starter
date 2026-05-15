import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Input, Label, Badge, Spinner } from '../../shared/ui'

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
    <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8">
      <div className="page-header">
        <h1 className="page-title">Search Students</h1>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input type="text" value={searchParams.name} onChange={e => set('name', e.target.value)} placeholder="Search by name…" />
            </div>
            <div className="space-y-2">
              <Label>Enrollment Number</Label>
              <Input type="text" value={searchParams.enrollmentNumber} onChange={e => set('enrollmentNumber', e.target.value)} placeholder="Search by enrollment number…" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Program</Label>
              <select className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={searchParams.program} onChange={e => set('program', e.target.value)}>
                <option value="">All Programs</option>
                {programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Academic Level</Label>
              <select className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={searchParams.level} onChange={e => set('level', e.target.value)}>
                <option value="">All Levels</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={searchParams.status} onChange={e => set('status', e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="graduated">Graduated</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Searching…' : 'Search'}</Button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Results ({results.length})</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Name</th><th>Enrollment #</th><th>Status</th><th>Enrolled</th><th></th></tr></thead>
              <tbody>
                {results.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.full_name}</td>
                    <td className="text-gray-500">{s.enrollment_number}</td>
                    <td>
                      {s.status === 'active' ? <Badge variant="success">{s.status}</Badge> :
                       s.status === 'suspended' ? <Badge variant="error">{s.status}</Badge> :
                       <Badge variant="default">{s.status}</Badge>}
                    </td>
                    <td className="text-gray-500">{s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString() : '—'}</td>
                    <td><Button variant="outline" size="sm" onClick={() => onSelectStudent(s)} className="text-xs py-1 px-3">View / Edit</Button></td>
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
