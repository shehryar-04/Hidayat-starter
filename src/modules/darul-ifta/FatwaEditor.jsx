import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../app/RoleProvider'
import { Button, Input, Textarea, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../shared/ui'

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

  // ── Publish (calls edge function to create entry in fatwas table) ──
  const handlePublish = async () => {
    setSaving(true); setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('publish-fatwa', {
        body: {
          question_id: fatwa.id,
          anonymize_questioner: anonymize,
        },
      })

      if (fnErr) throw fnErr
      if (data?.error) throw new Error(data.error)

      setStatus('published')
      setMsg(`Fatwa published to knowledge base. Number: ${data.fatwa_number || ''}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onCancel}>← Back</Button>
        <h1 className="text-xl font-bold text-neutral-800">{isEdit ? `Edit Fatwa — ${fatwa.reference_number}` : 'Create New Fatwa'}</h1>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>}
      {msg && <div className="bg-green-50 text-green-700 rounded-lg p-4 text-sm mb-4">{msg}</div>}

      {/* ── Question form ── */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Question Details</h3>
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Question <span className="text-red-500">*</span></Label>
            <Textarea
              id="questionText"
              rows={5}
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Enter the religious question…"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="context">Context / Background <span className="text-gray-400 font-normal">(optional)</span></Label>
            <Textarea
              id="context"
              rows={3}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Any additional context or background information…"
            />
          </div>
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={saving || !questionText.trim()} loading={saving}>
              {isEdit ? 'Update Question' : 'Create Fatwa'}
            </Button>
            {isEdit && ['under_review', 'approved'].includes(status) && (role === 'admin' || role === 'mufti') && (
              <Button type="button" variant="secondary" onClick={handlePublish} disabled={saving}>
                🌐 Publish Fatwa
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* ── Answers section (edit mode only) ── */}
      {isEdit && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Answer</h3>

          {/* Existing answer — only one allowed */}
          {existingResponses.length > 0 && (
            <div className="space-y-3 mb-6">
              {existingResponses.slice(0, 1).map(resp => (
                <div key={resp.id} className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary-600">Fatwa Answer</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        Answered {new Date(resp.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingResponseId(resp.id); setEditingResponseText(resp.response_text); setEditingResponseRefs(resp.quotes || '') }}
                      >Edit</Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAnswer(resp.id)}
                      >Delete</Button>
                    </div>
                  </div>

                  {editingResponseId === resp.id ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={4}
                        value={editingResponseText}
                        onChange={e => setEditingResponseText(e.target.value)}
                        placeholder="Answer text…"
                      />
                      <Input
                        value={editingResponseRefs}
                        onChange={e => setEditingResponseRefs(e.target.value)}
                        placeholder="Quotes (e.g. Quran 2:275, Sahih Bukhari 2083)…"
                      />
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => handleUpdateAnswer(resp.id)} disabled={saving}>Save</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingResponseId(null)}>Cancel</Button>
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
              <div className="space-y-2">
                <Label htmlFor="answerText">Write Answer</Label>
                <Textarea
                  id="answerText"
                  rows={5}
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  placeholder="Write the fatwa answer / ruling here…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answerRefs">Quotes <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  id="answerRefs"
                  value={answerRefs}
                  onChange={e => setAnswerRefs(e.target.value)}
                  placeholder="e.g. Quran 2:275, Sahih Bukhari 2083, Ibn Qudama al-Mughni…"
                />
                <p className="text-xs text-gray-400 mt-1">Cite Quranic verses, Hadith, or scholarly sources that support this ruling.</p>
              </div>
              <Button type="submit" variant="primary" disabled={saving || !answerText.trim()} loading={saving}>
                Add Answer
              </Button>
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
