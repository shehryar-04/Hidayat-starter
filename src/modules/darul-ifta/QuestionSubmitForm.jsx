import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Textarea, Label } from '../../shared/ui'

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
      <div className="max-w-xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 text-center py-10">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="font-serif text-xl text-primary-600 mb-2">Question Submitted</h2>
          <p className="text-sm text-gray-500 mb-1">Your question has been received and will be reviewed by our scholars.</p>
          <p className="text-xs font-mono text-gray-400 mt-3 mb-6">Reference: {submitted}</p>
          <Button variant="primary" onClick={onComplete}>Back to Fatwas</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
        <h2 className="font-serif text-xl text-primary-600 mb-1">Submit a Religious Question</h2>
        <p className="text-sm text-gray-500 mb-6">Your question will be reviewed and answered by our Muftis.</p>

        {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Your Question <span className="text-red-500">*</span></Label>
            <Textarea
              id="questionText"
              rows={5}
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Write your religious question clearly and concisely…"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context <span className="text-gray-400 font-normal">(optional)</span></Label>
            <Textarea
              id="context"
              rows={3}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Any background information that may help the Mufti answer your question…"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={saving || !questionText.trim()} loading={saving}>
              Submit Question
            </Button>
            <Button type="button" variant="ghost" onClick={onComplete}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
