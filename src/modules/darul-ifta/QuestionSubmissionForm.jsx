import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Textarea, Label } from '../../shared/ui'

/**
 * Question Submission Form Component
 * Allows any authenticated user to submit a religious question
 * Requirements: 8.1, 8.2
 */
export function QuestionSubmissionForm({ onComplete }) {
  const [formData, setFormData] = useState({
    question_text: '',
    context: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState(null)

  const generateReferenceNumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    return `FQ-${timestamp}-${random}`
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.question_text.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      const refNum = generateReferenceNumber()

      const { error: err } = await supabase
        .from('fatwa_questions')
        .insert({
          reference_number: refNum,
          submitted_by: user.user.id,
          question_text: formData.question_text,
          context: formData.context || null,
          status: 'pending',
        })

      if (err) throw err

      setReferenceNumber(refNum)
      setSuccess(true)
      setFormData({ question_text: '', context: '' })

      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (err) {
      setError(err.message)
      console.error('Error submitting question:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <h2 className="text-xl font-bold text-neutral-800 mb-4">Submit a Religious Question</h2>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>}

      {success && (
        <div className="bg-green-50 text-green-700 rounded-lg p-4 text-sm mb-4">
          <strong>Question submitted successfully!</strong>
          <p className="mt-1">Reference Number: {referenceNumber}</p>
          <p className="mt-1">Your question has been assigned a reference number for tracking.</p>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question_text">Your Question <span className="text-red-500">*</span></Label>
            <Textarea
              id="question_text"
              name="question_text"
              value={formData.question_text}
              onChange={handleInputChange}
              required
              placeholder="Please enter your religious question..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context <span className="text-gray-400 font-normal">(Optional)</span></Label>
            <Textarea
              id="context"
              name="context"
              value={formData.context}
              onChange={handleInputChange}
              placeholder="Provide any additional context or background information..."
              rows={4}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" variant="primary" disabled={loading || !formData.question_text.trim()} loading={loading}>
              Submit Question
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
