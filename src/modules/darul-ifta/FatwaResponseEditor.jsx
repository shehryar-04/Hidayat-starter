import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Fatwa Response Editor Component
 * Allows Mufti to submit responses and manage fatwa workflow
 * Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
export function FatwaResponseEditor({ question, onBack, onComplete }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [responses, setResponses] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [showPublishForm, setShowPublishForm] = useState(false)
  const [anonymizeQuestioner, setAnonymizeQuestioner] = useState(false)

  useEffect(() => {
    loadUserInfo()
    loadResponses()
    loadAuditLog()
  }, [question.id])

  const loadUserInfo = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      setUserId(user.user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.user.id)
        .single()

      setUserRole(profile?.role)
    } catch (err) {
      console.error('Error loading user info:', err)
    }
  }

  const loadResponses = async () => {
    try {
      const { data, error: err } = await supabase
        .from('fatwa_responses')
        .select(
          `
          id,
          question_id,
          mufti_id,
          response_text,
          submitted_at,
          profiles:mufti_id (
            id,
            full_name
          )
        `
        )
        .eq('question_id', question.id)
        .order('submitted_at')

      if (err) throw err
      setResponses(data || [])
    } catch (err) {
      console.error('Error loading responses:', err)
    }
  }

  const loadAuditLog = async () => {
    try {
      const { data, error: err } = await supabase
        .from('fatwa_audit_log')
        .select(
          `
          id,
          question_id,
          old_status,
          new_status,
          acted_at,
          profiles:actor_id (
            id,
            full_name
          )
        `
        )
        .eq('question_id', question.id)
        .order('acted_at')

      if (err) throw err
      setAuditLog(data || [])
    } catch (err) {
      console.error('Error loading audit log:', err)
    }
  }

  const handleSubmitResponse = async (e) => {
    e.preventDefault()
    if (!response.trim()) return

    setLoading(true)
    try {
      // Insert response
      const { error: err1 } = await supabase
        .from('fatwa_responses')
        .insert({
          question_id: question.id,
          mufti_id: userId,
          response_text: response,
          submitted_at: new Date().toISOString(),
        })

      if (err1) throw err1

      // Update question status
      const { error: err2 } = await supabase
        .from('fatwa_questions')
        .update({ status: 'under_review' })
        .eq('id', question.id)

      if (err2) throw err2

      // Log to audit
      const { error: err3 } = await supabase
        .from('fatwa_audit_log')
        .insert({
          question_id: question.id,
          old_status: question.status,
          new_status: 'under_review',
          actor_id: userId,
          acted_at: new Date().toISOString(),
        })

      if (err3) throw err3

      setResponse('')
      await loadResponses()
      await loadAuditLog()
    } catch (err) {
      setError(err.message)
      console.error('Error submitting response:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePublishFatwa = async () => {
    try {
      const response = await supabase.functions.invoke('publish-fatwa', {
        body: {
          question_id: question.id,
          anonymize_questioner: anonymizeQuestioner,
          published_by: userId,
        },
      })

      if (response.error) throw response.error

      setShowPublishForm(false)
      await loadAuditLog()
      onComplete()
    } catch (err) {
      setError(err.message)
      console.error('Error publishing fatwa:', err)
    }
  }

  return (
    <div className="fatwa-response-editor">
      <button onClick={onBack} className="back-button">
        ← Back to Questions
      </button>

      <div className="question-display">
        <h2>Question: {question.reference_number}</h2>
        <div className="question-content">
          <p className="question-text">{question.question_text}</p>
          {question.context && (
            <p className="question-context">
              <strong>Context:</strong> {question.context}
            </p>
          )}
        </div>
        <div className="question-status">
          <span className={`status-badge ${question.status}`}>
            {question.status}
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Display existing responses */}
      {responses.length > 0 && (
        <div className="responses-section">
          <h3>Responses</h3>
          {responses.map((resp) => (
            <div key={resp.id} className="response-item">
              <div className="response-header">
                <strong>{resp.profiles?.full_name}</strong>
                <small>
                  {new Date(resp.submitted_at).toLocaleDateString()}
                </small>
              </div>
              <p className="response-text">{resp.response_text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Response form for Mufti */}
      {(userRole === 'mufti' || userRole === 'admin') &&
        question.status !== 'published' && (
          <form onSubmit={handleSubmitResponse} className="response-form">
            <h3>Submit Fatwa Response</h3>
            <div className="form-group">
              <label htmlFor="response">Your Response</label>
              <textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Enter your fatwa response..."
                rows="6"
              />
            </div>
            <button type="submit" disabled={loading || !response.trim()}>
              {loading ? 'Submitting...' : 'Submit Response'}
            </button>
          </form>
        )}

      {/* Publish form for Admin */}
      {userRole === 'admin' && question.status === 'under_review' && (
        <div className="publish-section">
          {!showPublishForm ? (
            <button
              onClick={() => setShowPublishForm(true)}
              className="publish-button"
            >
              Approve & Publish Fatwa
            </button>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault()
              handlePublishFatwa()
            }} className="publish-form">
              <div className="form-group">
                <label htmlFor="anonymize">
                  <input
                    id="anonymize"
                    type="checkbox"
                    checked={anonymizeQuestioner}
                    onChange={(e) =>
                      setAnonymizeQuestioner(e.target.checked)
                    }
                  />
                  Anonymize Questioner
                </label>
              </div>
              <div className="button-group">
                <button type="submit" disabled={loading}>
                  {loading ? 'Publishing...' : 'Publish Fatwa'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPublishForm(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Audit log */}
      <div className="audit-section">
        <button
          onClick={() => setShowAuditLog(!showAuditLog)}
          className="toggle-audit-button"
        >
          {showAuditLog ? 'Hide' : 'Show'} Audit Log
        </button>

        {showAuditLog && (
          <div className="audit-log">
            <h3>Status History</h3>
            {auditLog.length === 0 ? (
              <p>No status changes recorded</p>
            ) : (
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Old Status</th>
                    <th>New Status</th>
                    <th>Actor</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.old_status || 'N/A'}</td>
                      <td>{entry.new_status}</td>
                      <td>{entry.profiles?.full_name || 'Unknown'}</td>
                      <td>
                        {new Date(entry.acted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
