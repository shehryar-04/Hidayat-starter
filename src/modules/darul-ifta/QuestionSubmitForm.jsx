import { useState } from 'react'
import { supabase } from '../../lib/supabase'

function generateRef() {
  return `FQ-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`
}

export function QuestionSubmitForm({ onComplete }) {
  const [questionText, setQuestionText] = useState('')
  const [context, setContext] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!questionText.trim()) return
    setSaving(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ref = generateRef()
      const { error: err } = await supabase.from('fatwa_questions').insert({
        reference_number: ref,
        submitted_by: user.id,
        question_text: questionText,
        context: context || null,
        status: 'pending',
      })
      if (err) throw err
      setSubmitted(ref)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <div className="page max-w-xl">
        <div className="card text-center py-10">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="font-serif text-xl text-primary mb-2">Question Submitted</h2>
          <p className="text-sm text-gray-500 mb-1">Your question has been received and will be reviewed by our scholars.</p>
          <p className="text-xs font-mono text-gray-400 mt-3 mb-6">Reference: {submitted}</p>
          <button onClick={onComplete} className="btn-primary">Back to Fatwas</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page max-w-xl">
      <div className="card">
        <h2 className="font-serif text-xl text-primary mb-1">Submit a Religious Question</h2>
        <p className="text-sm text-gray-500 mb-6">Your question will be reviewed and answered by our Muftis.</p>

        {error && <div className="alert-error mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Your Question <span className="text-tertiary">*</span></label>
            <textarea
              className="form-input"
              rows={5}
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Write your religious question clearly and concisely…"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Additional Context <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className="form-input"
              rows={3}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Any background information that may help the Mufti answer your question…"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !questionText.trim()} className="btn-primary">
              {saving ? 'Submitting…' : 'Submit Question'}
            </button>
            <button type="button" onClick={onComplete} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
