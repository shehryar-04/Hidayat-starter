import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Input, Card, CardContent, Badge, Spinner, EmptyState } from '../../shared/ui'
import { Scale } from 'lucide-react'

const STATUS_VARIANT = {
  pending: 'warning',
  assigned: 'info',
  under_review: 'default',
  approved: 'success',
  published: 'success',
  closed: 'error',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          className="flex-1"
          placeholder="Search by question or reference…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:w-44"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {['pending','assigned','under_review','approved','published','closed'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Scale}
          title={fatwas.length === 0 ? 'No fatwas yet' : 'No results'}
          description={fatwas.length === 0 ? 'No fatwa questions have been submitted.' : 'No results match your search.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(fatwa => (
            <Card key={fatwa.id}>
              {/* Header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-neutral-500">{fatwa.reference_number}</span>
                  <Badge variant={STATUS_VARIANT[fatwa.status] || 'default'}>
                    {fatwa.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-neutral-400">{new Date(fatwa.created_at).toLocaleDateString()}</span>
                </div>
                {canManage && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onEdit(fatwa)}>Edit</Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(fatwa.id)}
                      loading={deleting === fatwa.id}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Question */}
              <CardContent>
                <p className="text-sm font-medium text-neutral-800 mb-1">{fatwa.question_text}</p>
                {fatwa.context && (
                  <p className="text-xs text-neutral-500 mt-1"><span className="font-semibold">Context:</span> {fatwa.context}</p>
                )}
                <p className="text-xs text-neutral-400 mt-2">
                  Submitted by: {fatwa.profiles?.full_name || 'Anonymous'}
                  {fatwa.assigned_profiles && ` · Assigned to: ${fatwa.assigned_profiles.full_name}`}
                </p>
              </CardContent>

              {/* Responses */}
              {fatwa.fatwa_responses?.length > 0 && (
                <div className="px-5 pb-4">
                  {(() => {
                    const answer = fatwa.fatwa_responses[0]
                    return (
                      <div className="bg-neutral-50 rounded-lg px-4 py-3 border-l-4 border-primary-500">
                        <p className="text-[10px] text-neutral-400 mb-1">
                          Answered {new Date(answer.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-neutral-700 leading-relaxed">{answer.response_text}</p>
                        {answer.quotes && (
                          <div className="mt-2 pt-2 border-t border-neutral-200">
                            <p className="text-xs font-semibold text-neutral-500 mb-0.5">📚 References</p>
                            <p className="text-xs text-neutral-600 leading-relaxed">{answer.quotes}</p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
