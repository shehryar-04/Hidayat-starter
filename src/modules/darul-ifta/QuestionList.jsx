import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Question List Component
 * Displays fatwa questions with filtering by status
 * Requirements: 8.1, 8.2, 8.3
 */
export function QuestionList({ onSelectQuestion }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    loadUserRole()
    loadQuestions()
  }, [statusFilter])

  const loadUserRole = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.user.id)
        .single()

      setUserRole(profile?.role)
    } catch (err) {
      console.error('Error loading user role:', err)
    }
  }

  const loadQuestions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('fatwa_questions')
        .select(
          `
          id,
          reference_number,
          submitted_by,
          question_text,
          context,
          status,
          assigned_mufti,
          duplicate_of,
          created_at,
          profiles:submitted_by (
            id,
            full_name
          ),
          assigned_profiles:assigned_mufti (
            id,
            full_name
          )
        `
        )

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error: err } = await query.order('created_at', {
        ascending: false,
      })

      if (err) throw err
      setQuestions(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToMufti = async (questionId, muftiId) => {
    try {
      const { data: user } = await supabase.auth.getUser()

      // Update question status
      const { error: err1 } = await supabase
        .from('fatwa_questions')
        .update({
          assigned_mufti: muftiId,
          status: 'assigned',
        })
        .eq('id', questionId)

      if (err1) throw err1

      // Log to audit
      const { error: err2 } = await supabase
        .from('fatwa_audit_log')
        .insert({
          question_id: questionId,
          old_status: 'pending',
          new_status: 'assigned',
          actor_id: user.user.id,
          acted_at: new Date().toISOString(),
        })

      if (err2) throw err2

      await loadQuestions()
    } catch (err) {
      setError(err.message)
      console.error('Error assigning question:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#fff3cd'
      case 'assigned':
        return '#cfe2ff'
      case 'under_review':
        return '#e2e3e5'
      case 'approved':
        return '#d1e7dd'
      case 'published':
        return '#d1e7dd'
      case 'closed':
        return '#f8d7da'
      default:
        return '#e0e0e0'
    }
  }

  if (loading) {
    return <div className="loading">Loading questions...</div>
  }

  return (
    <div className="question-list">
      <h2>Fatwa Questions</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-section">
        <label htmlFor="status-filter">Filter by Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="questions-list">
        {questions.length === 0 ? (
          <p>No questions found</p>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="question-card"
              style={{ borderLeftColor: getStatusColor(question.status) }}
            >
              <div className="question-header">
                <div className="question-meta">
                  <span className="reference-number">
                    {question.reference_number}
                  </span>
                  <span className={`status-badge ${question.status}`}>
                    {question.status}
                  </span>
                </div>
                <small className="submitted-date">
                  {new Date(question.created_at).toLocaleDateString()}
                </small>
              </div>

              <div className="question-content">
                <p className="question-text">{question.question_text}</p>
                {question.context && (
                  <p className="question-context">
                    <strong>Context:</strong> {question.context}
                  </p>
                )}
              </div>

              <div className="question-footer">
                <div className="question-info">
                  <small>
                    <strong>Submitted by:</strong>{' '}
                    {question.profiles?.full_name || 'Anonymous'}
                  </small>
                  {question.assigned_profiles && (
                    <small>
                      <strong>Assigned to:</strong>{' '}
                      {question.assigned_profiles.full_name}
                    </small>
                  )}
                </div>

                <div className="question-actions">
                  {(userRole === 'admin' || userRole === 'mufti') && (
                    <button
                      onClick={() => onSelectQuestion(question)}
                      className="respond-button"
                    >
                      {question.status === 'pending' ? 'Assign & Respond' : 'View'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
