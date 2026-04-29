import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_STYLES = {
  pending:      'bg-yellow-100 text-yellow-700',
  assigned:     'bg-blue-100 text-blue-700',
  under_review: 'bg-gray-100 text-gray-600',
  approved:     'bg-green-100 text-green-700',
  published:    'bg-primary-100 text-primary-700',
  closed:       'bg-red-100 text-red-700',
}

export function FatwaList({ onEdit, canManage }) {
  const [fatwas, setFatwas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { load() }, [statusFilter])

  const load = async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('fatwa_questions')
        .select(`
          id, reference_number, question_text, context, status, created_at,
          profiles:submitted_by(full_name),
          assigned_profiles:assigned_mufti(full_name),
          fatwa_responses(id, response_text, quotes, submitted_at)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') q = q.eq('status', statusFilter)

      const { data, error: err } = await q
      if (err) throw err
      setFatwas(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fatwa question and all its responses?')) return
    setDeleting(id)
    try {
      // Delete responses first (FK constraint)
      await supabase.from('fatwa_responses').delete().eq('question_id', id)
      await supabase.from('fatwa_audit_log').delete().eq('question_id', id)
      const { error: err } = await supabase.from('fatwa_questions').delete().eq('id', id)
      if (err) throw err
      setFatwas(f => f.filter(x => x.id !== id))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = fatwas.filter(f =>
    !search ||
    f.question_text.toLowerCase().includes(search.toLowerCase()) ||
    f.reference_number.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading">Loading fatwas…</div>

  return (
    <div className="page">
      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          className="form-input flex-1"
          placeholder="Search by question or reference…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {['pending','assigned','under_review','approved','published','closed'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">⚖️</div>
          <p className="text-sm">{fatwas.length === 0 ? 'No fatwas yet.' : 'No results match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(fatwa => (
            <div key={fatwa.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-gray-500">{fatwa.reference_number}</span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[fatwa.status] || 'bg-gray-100 text-gray-600'}`}>
                    {fatwa.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(fatwa.created_at).toLocaleDateString()}</span>
                </div>
                {canManage && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => onEdit(fatwa)} className="btn-outline text-xs py-1 px-3">Edit</button>
                    <button
                      onClick={() => handleDelete(fatwa.id)}
                      disabled={deleting === fatwa.id}
                      className="btn-danger text-xs py-1 px-3"
                    >
                      {deleting === fatwa.id ? '…' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>

              {/* Question */}
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-gray-800 mb-1">{fatwa.question_text}</p>
                {fatwa.context && (
                  <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Context:</span> {fatwa.context}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Submitted by: {fatwa.profiles?.full_name || 'Anonymous'}
                  {fatwa.assigned_profiles && ` · Assigned to: ${fatwa.assigned_profiles.full_name}`}
                </p>
              </div>

              {/* Responses — only show the first (and only) answer */}
              {fatwa.fatwa_responses?.length > 0 && (
                <div className="px-5 pb-4">
                  {(() => {
                    const answer = fatwa.fatwa_responses[0]
                    return (
                      <div className="bg-neutral-50 rounded-lg px-4 py-3 border-l-4 border-secondary">
                        <p className="text-[10px] text-gray-400 mb-1">
                          Answered {new Date(answer.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{answer.response_text}</p>
                        {answer.quotes && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 mb-0.5">📚 References</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{answer.quotes}</p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
