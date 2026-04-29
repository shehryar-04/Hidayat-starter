import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Eligibility Evaluation Component
 * Triggers wazifa eligibility evaluation based on configurable rules
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
export function EligibilityEvaluation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [evaluationResults, setEvaluationResults] = useState(null)
  const [wazifaRules, setWazifaRules] = useState(null)

  useEffect(() => {
    loadWazifaRules()
  }, [])

  const loadWazifaRules = async () => {
    try {
      const { data, error: err } = await supabase
        .from('wazifa_rules')
        .select('*')
        .eq('active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (err && err.code !== 'PGRST116') throw err
      setWazifaRules(data)
    } catch (err) {
      console.error('Error loading wazifa rules:', err)
    }
  }

  const handleEvaluate = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: user } = await supabase.auth.getUser()

      // Call the evaluate-wazifa Edge Function
      const response = await supabase.functions.invoke('evaluate-wazifa', {
        body: {
          evaluated_by: user.user.id,
        },
      })

      if (response.error) throw response.error

      setEvaluationResults(response.data)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
      console.error('Error evaluating wazifa eligibility:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="eligibility-evaluation">
      <h2>Wazifa Eligibility Evaluation</h2>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          Eligibility evaluation completed successfully!
        </div>
      )}

      <div className="rules-section">
        <h3>Active Rules</h3>
        {wazifaRules ? (
          <div className="rules-display">
            <p>
              <strong>Version:</strong> {wazifaRules.version}
            </p>
            <p>
              <strong>Last Updated:</strong>{' '}
              {new Date(wazifaRules.updated_at).toLocaleDateString()}
            </p>
            <div className="rules-content">
              <pre>{JSON.stringify(wazifaRules.rules, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <p>No active wazifa rules configured</p>
        )}
      </div>

      <button
        onClick={handleEvaluate}
        disabled={loading || !wazifaRules}
        className="evaluate-button"
      >
        {loading ? 'Evaluating...' : 'Run Eligibility Evaluation'}
      </button>

      {evaluationResults && (
        <div className="evaluation-results">
          <h3>Evaluation Results</h3>
          <div className="results-summary">
            <p>
              <strong>Total Students Evaluated:</strong>{' '}
              {evaluationResults.total_evaluated}
            </p>
            <p>
              <strong>Eligible Students:</strong>{' '}
              {evaluationResults.eligible_count}
            </p>
            <p>
              <strong>Total Stipend Amount:</strong> $
              {evaluationResults.total_stipend_amount?.toFixed(2) || '0.00'}
            </p>
            <p>
              <strong>Rule Version Applied:</strong>{' '}
              {evaluationResults.rule_version}
            </p>
            <p>
              <strong>Evaluation Timestamp:</strong>{' '}
              {new Date(evaluationResults.evaluated_at).toLocaleString()}
            </p>
          </div>

          {evaluationResults.eligible_students &&
            evaluationResults.eligible_students.length > 0 && (
              <div className="eligible-students">
                <h4>Eligible Students</h4>
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Enrollment Number</th>
                      <th>Stipend Amount</th>
                      <th>Qualifying Rules</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationResults.eligible_students.map((student) => (
                      <tr key={student.student_id}>
                        <td>{student.student_name}</td>
                        <td>{student.enrollment_number}</td>
                        <td>${student.stipend_amount?.toFixed(2) || '0.00'}</td>
                        <td>
                          {student.qualifying_rules?.join(', ') || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
