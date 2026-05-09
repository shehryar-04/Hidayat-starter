import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Transcript View Component
 * Displays per-student academic transcript with completed levels and evaluations
 * Requirements: 4.7
 */
export function TranscriptView({ selectedStudent }) {
  const [transcript, setTranscript] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (selectedStudent) {
      loadTranscript()
    }
  }, [selectedStudent])

  const loadTranscript = async () => {
    if (!selectedStudent) return

    setLoading(true)
    try {
      // Get all enrollments for this student
      const { data: enrollments, error: err1 } = await supabase
        .from('student_enrollments')
        .select(
          `
          id,
          student_id,
          program,
          level_id,
          enrolled_at,
          status,
          dars_e_nizami_levels:level_id (
            id,
            name,
            sequence_order,
            passing_threshold
          )
        `
        )
        .eq('student_id', selectedStudent.id)
        .eq('program', 'dars_e_nizami')
        .order('enrolled_at')

      if (err1) throw err1

      // Get all evaluations for this student
      const { data: evaluations, error: err2 } = await supabase
        .from('evaluations')
        .select(
          `
          id,
          student_id,
          subject_id,
          level_id,
          scholar_id,
          score,
          evaluated_at,
          flagged,
          dars_e_nizami_subjects:subject_id (
            id,
            name
          ),
          scholars:scholar_id (
            id,
            profile_id,
            profiles:profile_id (
              id,
              full_name
            )
          )
        `
        )
        .eq('student_id', selectedStudent.id)
        .order('evaluated_at')

      if (err2) throw err2

      // Build transcript structure
      const transcriptData = {
        student: selectedStudent,
        enrollments: enrollments || [],
        evaluations: evaluations || [],
        completedLevels: [],
      }

      // Determine completed levels
      if (enrollments && evaluations) {
        enrollments.forEach((enrollment) => {
          const levelEvals = evaluations.filter(
            (e) => e.level_id === enrollment.level_id
          )
          const levelSubjects = levelEvals.map((e) => e.subject_id)
          const allPassing = levelEvals.every(
            (e) =>
              e.score >= (enrollment.dars_e_nizami_levels?.passing_threshold || 50) &&
              !e.flagged
          )

          if (allPassing && levelSubjects.length > 0) {
            transcriptData.completedLevels.push({
              level: enrollment.dars_e_nizami_levels,
              enrolledAt: enrollment.enrolled_at,
              evaluations: levelEvals,
            })
          }
        })
      }

      setTranscript(transcriptData)
    } catch (err) {
      setError(err.message)
      console.error('Error loading transcript:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedStudent) {
    return (
      <div className="transcript-view">
        <p>Please select a student to view their transcript</p>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading transcript...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!transcript) {
    return <div className="transcript-view">No transcript data available</div>
  }

  return (
    <div className="transcript-view">
      <div className="transcript-header">
        <h2>Academic Transcript</h2>
        <div className="student-info">
          <p>
            <strong>Student:</strong> {transcript.student.profiles?.full_name}
          </p>
          <p>
            <strong>Enrollment Number:</strong>{' '}
            {transcript.student.enrollment_number}
          </p>
          <p>
            <strong>Program:</strong> Dars-e-Nizami
          </p>
        </div>
      </div>

      {transcript.completedLevels.length === 0 ? (
        <div className="no-completed-levels">
          <p>No completed levels yet</p>
        </div>
      ) : (
        <div className="completed-levels">
          <h3>Completed Levels</h3>
          {transcript.completedLevels.map((levelData, idx) => (
            <div key={idx} className="level-transcript">
              <div className="level-header">
                <h4>{levelData.level.name}</h4>
                <small>
                  Completed:{' '}
                  {new Date(levelData.enrolledAt).toLocaleDateString()}
                </small>
              </div>

              <table className="level-evaluations">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Evaluated By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {levelData.evaluations.map((evaluation) => (
                    <tr key={evaluation.id}>
                      <td>{evaluation.dars_e_nizami_subjects?.name}</td>
                      <td className="score">{evaluation.score}</td>
                      <td>
                        {evaluation.scholars?.profiles?.full_name || 'Unknown'}
                      </td>
                      <td>
                        {new Date(evaluation.evaluated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="level-summary">
                <strong>Average Score:</strong>{' '}
                {(
                  levelData.evaluations.reduce((sum, e) => sum + e.score, 0) /
                  levelData.evaluations.length
                ).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      {transcript.enrollments.length > 0 && (
        <div className="all-enrollments">
          <h3>All Enrollments</h3>
          <table className="enrollments-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Enrolled Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transcript.enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>{enrollment.dars_e_nizami_levels?.name}</td>
                  <td>
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`status-badge ${enrollment.status}`}>
                      {enrollment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
