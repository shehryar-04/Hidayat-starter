import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hifz Progress Grid Component
 * Displays 30-Juz progress grid with status updates and audit logging
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function HifzProgressGrid({ student, onBack }) {
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hifzStatus, setHifzStatus] = useState('in_progress')
  const [auditLog, setAuditLog] = useState([])
  const [showAuditLog, setShowAuditLog] = useState(false)

  useEffect(() => {
    loadProgress()
  }, [student.id])

  const loadProgress = async () => {
    setLoading(true)
    try {
      // Load Hifz progress for all 30 Juz
      const { data, error: err } = await supabase
        .from('hifz_progress')
        .select('*')
        .eq('student_id', student.id)

      if (err) throw err

      // Initialize progress object with all 30 Juz
      const progressObj = {}
      for (let i = 1; i <= 30; i++) {
        const juzData = data?.find((d) => d.juz_number === i)
        progressObj[i] = juzData || {
          juz_number: i,
          status: 'not_started',
          memorized_at: null,
          scholar_id: null,
        }
      }
      setProgress(progressObj)

      // Load audit log
      const { data: auditData, error: auditErr } = await supabase
        .from('hifz_audit_log')
        .select(
          `
          id,
          juz_number,
          old_status,
          new_status,
          changed_at,
          profiles:changed_by (
            id,
            full_name
          )
        `
        )
        .eq('student_id', student.id)
        .order('changed_at', { ascending: false })

      if (auditErr) throw auditErr
      setAuditLog(auditData || [])

      // Check if all 30 Juz are memorized
      const allMemorized = Object.values(progressObj).every(
        (juz) => juz.status === 'memorized'
      )
      setHifzStatus(allMemorized ? 'complete' : 'in_progress')
    } catch (err) {
      setError(err.message)
      console.error('Error loading progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (juzNumber, newStatus) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      const { data: scholar } = await supabase
        .from('scholars')
        .select('id')
        .eq('profile_id', user.user.id)
        .single()

      const currentJuz = progress[juzNumber]
      const oldStatus = currentJuz.status

      // Update or insert hifz_progress
      if (currentJuz.id) {
        const { error: err } = await supabase
          .from('hifz_progress')
          .update({
            status: newStatus,
            memorized_at:
              newStatus === 'memorized'
                ? new Date().toISOString().split('T')[0]
                : currentJuz.memorized_at,
            scholar_id: scholar?.id,
          })
          .eq('id', currentJuz.id)

        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('hifz_progress')
          .insert({
            student_id: student.id,
            juz_number: juzNumber,
            status: newStatus,
            memorized_at:
              newStatus === 'memorized'
                ? new Date().toISOString().split('T')[0]
                : null,
            scholar_id: scholar?.id,
          })

        if (err) throw err
      }

      // Log to audit table
      const { error: auditErr } = await supabase
        .from('hifz_audit_log')
        .insert({
          student_id: student.id,
          juz_number: juzNumber,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: user.user.id,
          changed_at: new Date().toISOString(),
        })

      if (auditErr) throw auditErr

      // Update local state
      setProgress((prev) => ({
        ...prev,
        [juzNumber]: {
          ...prev[juzNumber],
          status: newStatus,
          memorized_at:
            newStatus === 'memorized'
              ? new Date().toISOString().split('T')[0]
              : prev[juzNumber].memorized_at,
          scholar_id: scholar?.id,
        },
      }))

      // Check if all 30 Juz are now memorized
      const allMemorized = Object.values(progress).every(
        (juz) => juz.status === 'memorized' || juz.juz_number === juzNumber
      )
      if (newStatus === 'memorized' && allMemorized) {
        setHifzStatus('complete')
      }

      await loadProgress()
    } catch (err) {
      setError(err.message)
      console.error('Error updating status:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started':
        return '#e0e0e0'
      case 'in_progress':
        return '#fff3cd'
      case 'memorized':
        return '#d4edda'
      case 'revised':
        return '#cfe2ff'
      default:
        return '#e0e0e0'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'not_started':
        return 'Not Started'
      case 'in_progress':
        return 'In Progress'
      case 'memorized':
        return 'Memorized'
      case 'revised':
        return 'Revised'
      default:
        return status
    }
  }

  if (loading) {
    return <div className="loading">Loading Hifz progress...</div>
  }

  return (
    <div className="hifz-progress-grid">
      <button onClick={onBack} className="back-button">
        ← Back to Search
      </button>

      <div className="progress-header">
        <h2>Hifz Progress - {student.profiles?.full_name}</h2>
        <div className="status-info">
          <p>
            <strong>Enrollment:</strong> {student.enrollment_number}
          </p>
          <p>
            <strong>Overall Status:</strong>{' '}
            <span className={`status-badge ${hifzStatus}`}>
              {hifzStatus === 'complete' ? 'Complete' : 'In Progress'}
            </span>
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {hifzStatus === 'complete' && (
        <div className="success-message">
          <strong>Hifz Complete!</strong> All 30 Juz have been memorized.
        </div>
      )}

      <div className="juz-grid">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNumber) => {
          const juzData = progress[juzNumber]
          const status = juzData?.status || 'not_started'

          return (
            <div
              key={juzNumber}
              className="juz-card"
              style={{ backgroundColor: getStatusColor(status) }}
            >
              <div className="juz-number">Juz {juzNumber}</div>
              <div className="juz-status">{getStatusLabel(status)}</div>

              <div className="status-buttons">
                <button
                  onClick={() => handleStatusChange(juzNumber, 'not_started')}
                  className={`status-btn ${
                    status === 'not_started' ? 'active' : ''
                  }`}
                  title="Not Started"
                >
                  ○
                </button>
                <button
                  onClick={() => handleStatusChange(juzNumber, 'in_progress')}
                  className={`status-btn ${
                    status === 'in_progress' ? 'active' : ''
                  }`}
                  title="In Progress"
                >
                  ◐
                </button>
                <button
                  onClick={() => handleStatusChange(juzNumber, 'memorized')}
                  className={`status-btn ${
                    status === 'memorized' ? 'active' : ''
                  }`}
                  title="Memorized"
                >
                  ●
                </button>
                <button
                  onClick={() => handleStatusChange(juzNumber, 'revised')}
                  className={`status-btn ${
                    status === 'revised' ? 'active' : ''
                  }`}
                  title="Revised"
                >
                  ✓
                </button>
              </div>

              {juzData?.memorized_at && (
                <small className="memorized-date">
                  {new Date(juzData.memorized_at).toLocaleDateString()}
                </small>
              )}
            </div>
          )
        })}
      </div>

      <div className="audit-section">
        <button
          onClick={() => setShowAuditLog(!showAuditLog)}
          className="toggle-audit-button"
        >
          {showAuditLog ? 'Hide' : 'Show'} Audit Log
        </button>

        {showAuditLog && (
          <div className="audit-log">
            <h3>Change History</h3>
            {auditLog.length === 0 ? (
              <p>No changes recorded</p>
            ) : (
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Juz</th>
                    <th>Old Status</th>
                    <th>New Status</th>
                    <th>Changed By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td>Juz {entry.juz_number}</td>
                      <td>{getStatusLabel(entry.old_status)}</td>
                      <td>{getStatusLabel(entry.new_status)}</td>
                      <td>{entry.profiles?.full_name || 'Unknown'}</td>
                      <td>
                        {new Date(entry.changed_at).toLocaleDateString()}
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
