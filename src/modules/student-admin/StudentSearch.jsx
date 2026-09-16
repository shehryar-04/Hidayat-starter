import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Input, Label, Badge, Spinner } from '../../shared/ui'

export function StudentSearch({ onSelectStudent }) {
  const [searchParams, setSearchParams] = useState({ name: '', enrollmentNumber: '', program: '', level: '', status: 'active' })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
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
      const { data: students, error } = typeof query.limit === 'function' ? await query.limit(100) : await query
      if (error) throw error
      if (students?.length > 0) {
        const profileIds = students.map(s => s.profile_id).filter(Boolean)
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', profileIds)
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]))
        let filtered = students.map(s => ({ ...s, full_name: profileMap[s.profile_id] || 'Unknown' }))
        if (searchParams.name) filtered = filtered.filter(s => s.full_name.toLowerCase().includes(searchParams.name.toLowerCase()))
        setResults(filtered)
      } else {
        setResults([])
      }
      setSearched(true)
    } catch (err) {
      console.error(err)
      setResults([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const set = (key, val) => setSearchParams(p => ({ ...p, [key]: val }))

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] rounded-2xl shadow-xs p-6">
        <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-white mb-4">Search Students</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="space-y-2">
              <Label>Program</Label>
              <select className="h-10 w-full rounded-xl border border-neutral-200/90 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 px-3 text-sm transition-all outline-none focus:ring-2 focus:ring-primary-500" value={searchParams.program} onChange={e => set('program', e.target.value)}>
                <option value="">All Programs</option>
                {programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Academic Level</Label>
              <select className="h-10 w-full rounded-xl border border-neutral-200/90 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 px-3 text-sm transition-all outline-none focus:ring-2 focus:ring-primary-500" value={searchParams.level} onChange={e => set('level', e.target.value)}>
                <option value="">All Levels</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select className="h-10 w-full rounded-xl border border-neutral-200/90 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 px-3 text-sm transition-all outline-none focus:ring-2 focus:ring-primary-500" value={searchParams.status} onChange={e => set('status', e.target.value)}>
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

      {searched && results.length === 0 && (
        <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] rounded-2xl shadow-xs p-12 text-center text-neutral-400">
          <p className="text-sm">No students found matching your criteria.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] rounded-2xl shadow-xs p-6">
          <h3 className="text-base font-display font-bold text-neutral-800 dark:text-neutral-200 mb-4">Results ({results.length})</h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200/80 dark:border-[#1a2e23] bg-neutral-50/60 dark:bg-[#14221b]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400">Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400">Enrollment #</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400">Enrolled</th>
                  <th className="px-4 py-2.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#1a2e23]">
                {results.map(s => (
                  <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-[#14221b]/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{s.full_name}</td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 font-mono">{s.enrollment_number}</td>
                    <td className="px-4 py-3">
                      {s.status === 'active' ? <Badge variant="success">{s.status}</Badge> :
                       s.status === 'suspended' ? <Badge variant="warning">{s.status}</Badge> :
                       <Badge variant="secondary">{s.status}</Badge>}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">{s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {onSelectStudent && (
                        <Button size="sm" variant="outline" onClick={() => onSelectStudent(s.id)}>View Profile</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentSearch
