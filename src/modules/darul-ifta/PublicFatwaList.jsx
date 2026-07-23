import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { Input, Spinner, SearchResultsSkeleton } from '../../shared/ui'
import { ChevronDown, ChevronRight } from 'lucide-react'

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function PublicFatwaList({ hideHeader = false }) {
  const [fatwas, setFatwas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      // 1. Fetch from fatwa_questions (workflow-based, published)
      const { data: questionsData, error: qErr } = await supabase
        .from('fatwa_questions')
        .select(`
          id, reference_number, question_text, context, created_at,
          fatwa_responses(id, response_text, quotes, submitted_at)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (qErr) throw qErr

      // 2. Fetch from fatwas table (legacy / directly published)
      const { data: fatwasData, error: fErr } = await supabase
        .from('fatwas')
        .select('id, fatwa_number, title, question, answer, fatwa_ref, dar_ul_ifta, category_1, category_2, category_3, source_question_id, created_at')
        .order('created_at', { ascending: false })

      if (fErr) throw fErr

      // 3. Normalize fatwa_questions (no category columns here)
      const fromQuestions = (questionsData || []).map(q => ({
        id: q.id,
        source: 'questions',
        reference_number: q.reference_number,
        question_text: q.question_text,
        context: q.context,
        category_1: null,
        category_2: null,
        category_3: null,
        created_at: q.created_at,
        answer: q.fatwa_responses?.[0] || null,
      }))

      // 4. Normalize fatwas table — skip duplicates
      const questionIds = new Set(fromQuestions.map(q => q.id))
      const fromFatwasTable = (fatwasData || [])
        .filter(f => !f.source_question_id || !questionIds.has(f.source_question_id))
        .map(f => ({
          id: `fatwas-${f.id}`,
          source: 'fatwas',
          reference_number: f.fatwa_number || f.id,
          question_text: f.title || f.question,
          context: null,
          category_1: f.category_1 || null,
          category_2: f.category_2 || null,
          category_3: f.category_3 || null,
          created_at: f.created_at,
          answer: f.answer ? {
            id: f.id,
            response_text: f.answer,
            quotes: f.fatwa_ref || null,
            submitted_at: f.created_at,
          } : null,
        }))

      // 5. Merge and sort
      const merged = [...fromQuestions, ...fromFatwasTable]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setFatwas(merged)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Group fatwas by category_1
  const groupedByCategory = useMemo(() => {
    const filtered = fatwas.filter(f =>
      !search ||
      f.question_text?.toLowerCase().includes(search.toLowerCase()) ||
      f.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      f.answer?.response_text?.toLowerCase().includes(search.toLowerCase())
    )

    const groups = {}
    const uncategorized = []

    for (const fatwa of filtered) {
      if (fatwa.category_1) {
        if (!groups[fatwa.category_1]) {
          groups[fatwa.category_1] = []
        }
        groups[fatwa.category_1].push(fatwa)
      } else {
        uncategorized.push(fatwa)
      }
    }

    // Sort categories alphabetically
    const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))

    if (uncategorized.length > 0) {
      sorted.push(['Uncategorized', uncategorized])
    }

    return sorted
  }, [fatwas, search])

  const totalFiltered = useMemo(() =>
    groupedByCategory.reduce((sum, [, items]) => sum + items.length, 0),
    [groupedByCategory]
  )

  const toggleFatwa = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))
  const toggleCategory = (cat) => setExpandedCategories(e => ({ ...e, [cat]: !e[cat] }))

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8">
        <SearchResultsSkeleton count={5} />
      </div>
    )
  }

  return (
    <div className={hideHeader ? '' : 'max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8'}>
      {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>}

      <div className="mb-6">
        <Input
          className="max-w-lg"
          placeholder="Search fatwas by question or keyword…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-2">{totalFiltered} fatwas across {groupedByCategory.length} categories</p>
      </div>

      {totalFiltered === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">⚖️</div>
          <p className="text-sm">{fatwas.length === 0 ? 'No published fatwas yet.' : 'No results match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByCategory.map(([categoryName, items]) => {
            const isCatOpen = expandedCategories[categoryName] !== false // default open

            return (
              <div key={categoryName} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(categoryName)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 bg-neutral-50 hover:bg-neutral-100 transition-colors border-b border-neutral-200"
                >
                  <div className="flex items-center gap-3">
                    {isCatOpen
                      ? <ChevronDown className="w-5 h-5 text-primary-600" />
                      : <ChevronRight className="w-5 h-5 text-gray-400" />
                    }
                    <h3 className="font-semibold text-primary-700 text-base">{categoryName}</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-100 text-primary-700">
                    {items.length}
                  </span>
                </button>

                {/* Fatwas in this category */}
                {isCatOpen && (
                  <div className="divide-y divide-neutral-100">
                    {items.map(fatwa => {
                      const isOpen = expanded[fatwa.id]
                      const answer = fatwa.answer

                      return (
                        <div key={fatwa.id}>
                          {/* Fatwa row */}
                          <button
                            onClick={() => toggleFatwa(fatwa.id)}
                            className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-mono text-[10px] font-bold text-gray-400">{fatwa.reference_number}</span>
                                {fatwa.category_2 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-gray-500">{fatwa.category_2}</span>
                                )}
                                {fatwa.category_3 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-gray-500">{fatwa.category_3}</span>
                                )}
                                {answer && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Answered</span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-800 leading-snug">{fatwa.question_text}</p>
                              <p className="text-xs text-gray-400 mt-1">{fmt(fatwa.created_at)}</p>
                            </div>
                            <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Expanded answer */}
                          {isOpen && (
                            <div className="border-t border-neutral-100">
                              {fatwa.context && (
                                <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                    <span className="font-semibold">Context: </span>{fatwa.context}
                                  </p>
                                </div>
                              )}

                              {answer ? (
                                <div className="px-5 py-5">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                                      <span className="text-white text-xs">⚖</span>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-primary-600">Fatwa Answer</p>
                                      {answer.submitted_at && (
                                        <p className="text-[10px] text-gray-400">Answered {fmt(answer.submitted_at)}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="bg-neutral-50 rounded-lg px-4 py-4 border-l-4 border-primary-500">
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
          })}
        </div>
      )}
    </div>
  )
}
