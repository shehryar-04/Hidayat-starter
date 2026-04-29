import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../app/RoleProvider'

const STATUSES = ['pending', 'assigned', 'under_review', 'approved', 'published', 'closed']

function generateRef() {
  return `FQ-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`
}

export function FatwaEditor({ fatwa, onComplete, onCancel }) {
  const { role } = useRole()
  const isEdit = !!fatwa

  // Question fields
  const [questionText, setQuestionText] = useState(fatwa?.question_text || '')
  const [context, setContext] = useState(fatwa?.context || '')
  const [status, setStatus] = useState(fatwa?.status || 'pending')
  const [anonymize, setAnonymize] = useState(false)

  // Answer fields
  const [answerText, setAnswerText] = useState('')
  const [answerRefs, setAnswerRefs] = useState('')
  const [existingResponses, setExistingResponses] = useState([])
  const [editingResponseId, setEditingResponseId] = useState(null)
  const [editingResponseText, setEditingResponseText] = useState('')
  const [editingResponseRefs, setEditingResponseRefs] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (isEdit && fatwa?.id) loadResponses()
  }, [fatwa?.id])

  const loadResponses = async () => {
    const { data } = await supabase
      .from('fatwa_responses')
      .select('id, response_text, quotes, submitted_at')
      .eq('question_id', fatwa.id)
      .order('submitted_at')
      .limit(1)
    setExistingResponses(data || [])
  }

  // ── Save question ─────────────────────────────────────────
  const handleSaveQuestion = async (e) => {
    e.preventDefault()
    if (!questionText.trim()) return
    setSaving(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (isEdit) {
        const { error: err } = await supabase
          .from('fatwa_questions')
          .update({ question_text: questionText, context: context || null, status })
          .eq('id', fatwa.id)
        if (err) throw err

        // Log status change if changed
        if (status !== fatwa.status) {
          await supabase.from('fatwa_audit_log').insert({
            question_id: fatwa.id,
            old_status: fatwa.status,
            new_status: status,
            actor_id: user.id,
          })
        }
        setMsg('Fatwa updated.')
      } else {
        const ref = generateRef()
        const { error: err } = await supabase
          .from('fatwa_questions')
          .insert({
            reference_number: ref,
            submitted_by: user.id,
            question_text: questionText,
            context: context || null,
            status: 'pending',
          })
        if (err) throw err
        setMsg(`Fatwa created. Reference: ${ref}`)
        setTimeout(() => onComplete(), 1500)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Add answer ────────────────────────────────────────────
  const handleAddAnswer = async (e) => {
    e.preventDefault()
    if (!answerText.trim()) return
    setSaving(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error: err } = await supabase.from('fatwa_responses').insert({
        question_id: fatwa.id,
        mufti_id: user.id,
        response_text: answerText,
        quotes: answerRefs || null,
      })
      if (err) throw err

      // Move to under_review if still pending/assigned
      if (['pending', 'assigned'].includes(status)) {
        await supabase.from('fatwa_questions').update({ status: 'under_review' }).eq('id', fatwa.id)
        await supabase.from('fatwa_audit_log').insert({
          question_id: fatwa.id,
          old_status: status,
          new_status: 'under_review',
          actor_id: user.id,
        })
        setStatus('under_review')
      }

      setAnswerText('')
      setAnswerRefs('')
      await loadResponses()
      setMsg('Answer saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Edit existing answer ──────────────────────────────────
  const handleUpdateAnswer = async (id) => {
    if (!editingResponseText.trim()) return
    setSaving(true)
    try {
      const { error: err } = await supabase
        .from('fatwa_responses')
        .update({ response_text: editingResponseText, quotes: editingResponseRefs || null })
        .eq('id', id)
      if (err) throw err
      setEditingResponseId(null)
      setEditingResponseText('')
      setEditingResponseRefs('')
      await loadResponses()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete answer ─────────────────────────────────────────
  const handleDeleteAnswer = async (id) => {
    if (!window.confirm('Delete this answer?')) return
    const { error: err } = await supabase.from('fatwa_responses').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await loadResponses()
  }

  // ── Publish ───────────────────────────────────────────────
  const handlePublish = async () => {
    setSaving(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('fatwa_questions').update({ status: 'published' }).eq('id', fatwa.id)
      await supabase.from('fatwa_audit_log').insert({
        question_id: fatwa.id,
        old_status: status,
        new_status: 'published',
        actor_id: user.id,
      })
      setStatus('published')
      setMsg('Fatwa published.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="btn-ghost text-sm">← Back</button>
        <h1 className="page-title mb-0">{isEdit ? `Edit Fatwa — ${fatwa.reference_number}` : 'Create New Fatwa'}</h1>
      </div>

      {error && <div className="alert-error mb-4 text-sm">{error}</div>}
      {msg && <div className="alert-success mb-4 text-sm">{msg}</div>}

      {/* ── Question form ── */}
      <div className="card mb-6">
        <h3 className="mb-4">Question Details</h3>
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Question <span className="text-tertiary">*</span></label>
            <textarea
              className="form-input"
              rows={5}
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Enter the religious question…"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Context / Background <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className="form-input"
              rows={3}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Any additional context or background information…"
            />
          </div>
          {isEdit && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || !questionText.trim()} className="btn-primary">
              {saving ? 'Saving…' : isEdit ? 'Update Question' : 'Create Fatwa'}
            </button>
            {isEdit && status === 'under_review' && role === 'admin' && (
              <button type="button" onClick={handlePublish} disabled={saving} className="btn-secondary">
                🌐 Publish Fatwa
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Answers section (edit mode only) ── */}
      {isEdit && (
        <div className="card">
          <h3 className="mb-4">Answer</h3>

          {/* Existing answer — only one allowed */}
          {existingResponses.length > 0 && (
            <div className="space-y-3 mb-6">
              {existingResponses.slice(0, 1).map(resp => (
                <div key={resp.id} className="bg-neutral-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary">Fatwa Answer</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        Answered {new Date(resp.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => { setEditingResponseId(resp.id); setEditingResponseText(resp.response_text); setEditingResponseRefs(resp.quotes || '') }}
                        className="text-xs text-primary hover:underline"
                      >Edit</button>
                      <button onClick={() => handleDeleteAnswer(resp.id)} className="text-xs text-tertiary hover:underline">Delete</button>
                    </div>
                  </div>

                  {editingResponseId === resp.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="form-input text-sm"
                        rows={4}
                        value={editingResponseText}
                        onChange={e => setEditingResponseText(e.target.value)}
                        placeholder="Answer text…"
                      />
                      <input
                        className="form-input text-sm"
                        value={editingResponseRefs}
                        onChange={e => setEditingResponseRefs(e.target.value)}
                        placeholder="Quotes (e.g. Quran 2:275, Sahih Bukhari 2083)…"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateAnswer(resp.id)} disabled={saving} className="btn-primary text-xs py-1.5 px-3">Save</button>
                        <button onClick={() => setEditingResponseId(null)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-700 leading-relaxed">{resp.response_text}</p>
                      {resp.quotes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-500 mb-1">📚 References</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{resp.quotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add answer — only if no answer exists yet */}
          {existingResponses.length === 0 && status !== 'published' && status !== 'closed' && (
            <form onSubmit={handleAddAnswer} className="space-y-3">
              <div className="form-group">
                <label className="form-label">Write Answer</label>
                <textarea
                  className="form-input"
                  rows={5}
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  placeholder="Write the fatwa answer / ruling here…"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quotes <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="form-input"
                  value={answerRefs}
                  onChange={e => setAnswerRefs(e.target.value)}
                  placeholder="e.g. Quran 2:275, Sahih Bukhari 2083, Ibn Qudama al-Mughni…"
                />
                <p className="text-xs text-gray-400 mt-1">Cite Quranic verses, Hadith, or scholarly sources that support this ruling.</p>
              </div>
              <button type="submit" disabled={saving || !answerText.trim()} className="btn-primary">
                {saving ? 'Saving…' : 'Add Answer'}
              </button>
            </form>
          )}

          {(status === 'published' || status === 'closed') && existingResponses.length === 0 && (
            <p className="text-sm text-gray-400">No answers recorded.</p>
          )}
        </div>
      )}
    </div>
  )
}
