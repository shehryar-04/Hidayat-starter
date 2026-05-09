import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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
    <div className="page">
      {/* Search form */}
      <div className="card mb-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)}
                placeholder="Search by name…" />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <select className="form-input" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                <option value="">All Specializations</option>
                {allSpecializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Results */}
      {searched && (
        results.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
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
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 hover:border-primary-200 transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Avatar */}
                    {scholar.profiles?.avatar_url ? (
                      <img src={scholar.profiles.avatar_url} alt={fullName}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {initials(fullName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {scholar.title && (
                          <span className="text-xs text-secondary font-medium">{scholar.title}</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-primary-700 capitalize">
                          {scholar.profiles?.role || 'scholar'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm mt-0.5 group-hover:text-primary transition-colors truncate">
                        {fullName}
                      </p>
                    </div>
                  </div>

                  {/* Specializations */}
                  {scholar.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {scholar.specializations.slice(0, 3).map(sp => (
                        <span key={sp} className="text-[10px] bg-neutral-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                          {sp}
                        </span>
                      ))}
                      {scholar.specializations.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{scholar.specializations.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Qualifications count */}
                  {scholar.qualifications?.length > 0 && (
                    <p className="text-xs text-gray-400">
                      {scholar.qualifications.length} qualification{scholar.qualifications.length !== 1 ? 's' : ''}
                    </p>
                  )}

                  {/* Contact email */}
                  {scholar.contact_info?.email && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{scholar.contact_info.email}</p>
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
