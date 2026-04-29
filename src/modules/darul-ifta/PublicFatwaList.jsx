import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function PublicFatwaList({ hideHeader = false }) {
  const [fatwas, setFatwas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      // Use anon key — no auth header needed for public read
      const { data, error: err } = await supabase
        .from('fatwa_questions')
        .select(`
          id, reference_number, question_text, context, created_at,
          fatwa_responses(id, response_text, quotes, submitted_at)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      if (err) throw err
      setFatwas(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const filtered = fatwas.filter(f =>
    !search ||
    f.question_text.toLowerCase().includes(search.toLowerCase()) ||
    f.reference_number.toLowerCase().includes(search.toLowerCase()) ||
    f.fatwa_responses?.[0]?.response_text?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading">Loading fatwas…</div>

  return (
    <div className={hideHeader ? '' : 'page'}>
      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="mb-6">
        <input
          className="form-input max-w-lg"
          placeholder="Search fatwas by question or keyword…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">⚖️</div>
          <p className="text-sm">{fatwas.length === 0 ? 'No published fatwas yet.' : 'No results match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(fatwa => {
            const isOpen = expanded[fatwa.id]
            // Only show the first (and only) answer
            const answer = fatwa.fatwa_responses?.[0] || null

            return (
              <div key={fatwa.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Question row */}
                <button
                  onClick={() => toggle(fatwa.id)}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-gray-400">{fatwa.reference_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-primary-700">Published</span>
                      {answer && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700">Answered</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-snug">{fatwa.question_text}</p>
                    <p className="text-xs text-gray-400 mt-1">Asked {fmt(fatwa.created_at)}</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    {fatwa.context && (
                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs text-gray-500 leading-relaxed">
                          <span className="font-semibold">Context: </span>{fatwa.context}
                        </p>
                      </div>
                    )}

                    {answer ? (
                      <div className="px-5 py-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">⚖</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-primary">Fatwa Answer</p>
                            <p className="text-[10px] text-gray-400">Answered {fmt(answer.submitted_at)}</p>
                          </div>
                        </div>
                        <div className="bg-neutral-50 rounded-lg px-4 py-4 border-l-4 border-secondary">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{answer.response_text}</p>
                          {answer.quotes && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-500 mb-1">📚 References</p>
                              <p className="text-xs text-gray-600 leading-relaxed">{answer.quotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 py-4 text-sm text-gray-400 italic">
                        This question is awaiting an answer from our scholars.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
