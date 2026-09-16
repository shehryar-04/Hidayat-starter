import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Input, Label, Spinner } from '../../shared/ui'

export function ScholarSearch({ onSelectScholar }) {
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [status, setStatus] = useState('')
  const [results, setResults] = useState([])
  const [allSpecializations, setAllSpecializations] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(null)

  // Load all scholars on mount so the list is immediately visible
  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('scholars')
        .select(`
          id, profile_id, title, bio, qualifications, specializations,
          contact_info, employment_status, created_at,
          profiles:profile_id(id, full_name, role, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (err) throw err

      const scholars = data || []
      setResults(scholars)
      setSearched(true)

      // Collect unique specializations for the filter dropdown
      const specs = new Set()
      scholars.forEach(s => s.specializations?.forEach(sp => specs.add(sp)))
      setAllSpecializations([...specs].sort())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      let q = supabase
        .from('scholars')
        .select(`
          id, profile_id, title, bio, qualifications, specializations,
          contact_info, employment_status, created_at,
          profiles:profile_id(id, full_name, role, avatar_url)
        `)

      if (status) q = q.eq('employment_status', status)

      const { data, error: err } = await q.order('created_at', { ascending: false })
      if (err) throw err

      let filtered = data || []

      // Client-side name filter (profiles join can't be filtered server-side easily)
      if (name.trim()) {
        filtered = filtered.filter(s =>
          s.profiles?.full_name?.toLowerCase().includes(name.toLowerCase())
        )
      }

      // Client-side specialization filter
      if (specialization) {
        filtered = filtered.filter(s =>
          s.specializations?.some(sp => sp.toLowerCase().includes(specialization.toLowerCase()))
        )
      }

      setResults(filtered)
      setSearched(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const initials = (fullName) => {
    if (!fullName) return '?'
    return fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Search form */}
      <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] rounded-2xl shadow-xs p-6">
        <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-white mb-4">Search Scholars</h2>
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)}
                placeholder="Search by name…" />
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <select className="h-10 w-full rounded-xl border border-neutral-200/90 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary-500" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                <option value="">All Specializations</option>
                {allSpecializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select className="h-10 w-full rounded-xl border border-neutral-200/90 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary-500" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </form>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      {/* Results */}
      {searched && (
        results.length === 0 ? (
          <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] rounded-2xl shadow-xs p-12 text-center text-neutral-400">
            <div className="text-4xl mb-3">👨‍🏫</div>
            <p className="text-sm">No scholars found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map(scholar => {
              const fullName = scholar.profiles?.full_name || 'Unknown'
              const isActive = scholar.employment_status === 'active'

              return (
                <button
                  key={scholar.id}
                  onClick={() => onSelectScholar(scholar)}
                  className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs p-5 text-left hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 group cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Avatar */}
                    {scholar.profiles?.avatar_url ? (
                      <img src={scholar.profiles.avatar_url} alt={fullName}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-2 ring-primary-500/20" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ring-2 ring-primary-500/20">
                        {initials(fullName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {scholar.title && (
                          <span className="text-xs text-primary-600 dark:text-emerald-400 font-semibold">{scholar.title}</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40' : 'bg-neutral-100 dark:bg-[#14221b] text-neutral-600 dark:text-neutral-400'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#14221b] text-neutral-600 dark:text-neutral-300 capitalize border border-neutral-200/50 dark:border-[#1a2e23]">
                          {scholar.profiles?.role || 'scholar'}
                        </span>
                      </div>
                      <p className="font-display font-semibold text-neutral-900 dark:text-white text-sm mt-1 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {fullName}
                      </p>
                    </div>
                  </div>

                  {/* Specializations */}
                  {scholar.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {scholar.specializations.slice(0, 3).map(sp => (
                        <span key={sp} className="text-[10px] bg-neutral-50 dark:bg-[#14221b] text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-lg border border-neutral-200/60 dark:border-[#1a2e23]">
                          {sp}
                        </span>
                      ))}
                      {scholar.specializations.length > 3 && (
                        <span className="text-[10px] text-neutral-400">+{scholar.specializations.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Qualifications count */}
                  {scholar.qualifications?.length > 0 && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {scholar.qualifications.length} qualification{scholar.qualifications.length !== 1 ? 's' : ''}
                    </p>
                  )}

                  {/* Contact email */}
                  {scholar.contact_info?.email && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 truncate font-mono">{scholar.contact_info.email}</p>
                  )}
                </button>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

export default ScholarSearch
