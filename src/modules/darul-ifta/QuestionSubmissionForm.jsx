import { useState } from 'react'
import { supabase } from '../../lib/supabase'

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
    <div className="question-submission-form">
      <h2>Submit a Religious Question</h2>

      {error && <div className="error-message">{error}</div>}

      {success && (
        <div className="success-message">
          <strong>Question submitted successfully!</strong>
          <p>Reference Number: {referenceNumber}</p>
          <p>Your question has been assigned a reference number for tracking.</p>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="question_text">Your Question *</label>
            <textarea
              id="question_text"
              name="question_text"
              value={formData.question_text}
              onChange={handleInputChange}
              required
              placeholder="Please enter your religious question..."
              rows="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="context">Additional Context (Optional)</label>
            <textarea
              id="context"
              name="context"
              value={formData.context}
              onChange={handleInputChange}
              placeholder="Provide any additional context or background information..."
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading || !formData.question_text.trim()}>
              {loading ? 'Submitting...' : 'Submit Question'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
