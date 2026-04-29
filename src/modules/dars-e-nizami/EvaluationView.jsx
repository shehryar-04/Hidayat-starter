import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Evaluation View Component
 * Records evaluations for students in subjects and detects level completion
 * Requirements: 4.3, 4.4, 4.5, 4.6
 */
export function EvaluationView({ selectedStudent, selectedLevel }) {
  const [evaluations, setEvaluations] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)
  const [formData, setFormData] = useState({
    subject_id: '',
    score: '',
  })
  const [levelCompletion, setLevelCompletion] = useState(null)
  const [promotionEligible, setPromotionEligible] = useState(false)

  useEffect(() => {
    if (selectedStudent && selectedLevel) {
      loadEvaluations()
      loadSubjects()
      checkLevelCompletion()
    }
  }, [selectedStudent, selectedLevel])

  const loadEvaluations = async () => {
    if (!selectedStudent || !selectedLevel) return

    setLoading(true)
    try {
      const { data, error: err } = await supabase
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
        .eq('level_id', selectedLevel.id)
        .order('evaluated_at', { ascending: false })

      if (err) throw err
      setEvaluations(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading evaluations:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    if (!selectedLevel) return

    try {
      const { data, error: err } = await supabase
        .from('dars_e_nizami_subjects')
        .select('*')
        .eq('level_id', selectedLevel.id)
        .order('name')

      if (err) throw err
      setSubjects(data || [])
    } catch (err) {
      console.error('Error loading subjects:', err)
    }
  }

  const checkLevelCompletion = async () => {
    if (!selectedStudent || !selectedLevel) return

    try {
      // Get all subjects for this level
      const { data: levelSubjects, error: err1 } = await supabase
        .from('dars_e_nizami_subjects')
        .select('id')
        .eq('level_id', selectedLevel.id)

      if (err1) throw err1

      if (!levelSubjects || levelSubjects.length === 0) {
        setLevelCompletion(null)
        return
      }

      // Get evaluations for this student in this level
      const { data: evals, error: err2 } = await supabase
        .from('evaluations')
        .select('subject_id, score, flagged')
        .eq('student_id', selectedStudent.id)
        .eq('level_id', selectedLevel.id)

      if (err2) throw err2

      // Check if all subjects have passing evaluations
      const passingThreshold = selectedLevel.passing_threshold || 50
      const allSubjectsEvaluated = levelSubjects.every((subject) => {
        const evaluation = evals?.find((e) => e.subject_id === subject.id)
        return evaluation && evaluation.score >= passingThreshold && !evaluation.flagged
      })

      setPromotionEligible(allSubjectsEvaluated)
      setLevelCompletion(allSubjectsEvaluated ? 'complete' : 'incomplete')
    } catch (err) {
      console.error('Error checking level completion:', err)
    }
  }

  const handleRecordEvaluation = async (e) => {
    e.preventDefault()
    if (!formData.subject_id || !formData.score) return

    setLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      const { data: scholar } = await supabase
        .from('scholars')
        .select('id')
        .eq('profile_id', user.user.id)
        .single()

      const score = parseFloat(formData.score)
      const passingThreshold = selectedLevel.passing_threshold || 50
      const flagged = score < passingThreshold

      const { error: err } = await supabase
        .from('evaluations')
        .insert({
          student_id: selectedStudent.id,
          subject_id: formData.subject_id,
          level_id: selectedLevel.id,
          scholar_id: scholar?.id,
          score,
          evaluated_at: new Date().toISOString().split('T')[0],
          flagged,
        })

      if (err) throw err

      setFormData({ subject_id: '', score: '' })
      setShowEvaluationForm(false)
      await loadEvaluations()
      await checkLevelCompletion()
    } catch (err) {
      setError(err.message)
      console.error('Error recording evaluation:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteStudent = async () => {
    if (!promotionEligible) return

    setLoading(true)
    try {
      // Call the promote-student Edge Function
      const { data: user } = await supabase.auth.getUser()

      const response = await supabase.functions.invoke('promote-student', {
        body: {
          student_id: selectedStudent.id,
          current_level_id: selectedLevel.id,
          promoted_by: user.user.id,
        },
      })

      if (response.error) throw response.error

      alert('Student promoted successfully!')
      await loadEvaluations()
    } catch (err) {
      setError(err.message)
      console.error('Error promoting student:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedStudent || !selectedLevel) {
    return (
      <div className="evaluation-view">
        <p>Please select a student and level to view evaluations</p>
      </div>
    )
  }

  return (
    <div className="evaluation-view">
      <h2>
        Evaluations for {selectedStudent.profiles?.full_name} - {selectedLevel.name}
      </h2>

      {error && <div className="error-message">{error}</div>}

      {levelCompletion === 'complete' && (
        <div className="success-message">
          <strong>Level Complete!</strong> This student has passed all subjects
          and is eligible for promotion.
          <button
            onClick={handlePromoteStudent}
            disabled={loading}
            className="promote-button"
          >
            {loading ? 'Promoting...' : 'Promote to Next Level'}
          </button>
        </div>
      )}

      <button
        onClick={() => setShowEvaluationForm(!showEvaluationForm)}
        className="add-evaluation-button"
      >
        {showEvaluationForm ? 'Cancel' : 'Record Evaluation'}
      </button>

      {showEvaluationForm && (
        <form onSubmit={handleRecordEvaluation} className="evaluation-form">
          <div className="form-group">
            <label htmlFor="subject-select">Subject</label>
            <select
              id="subject-select"
              value={formData.subject_id}
              onChange={(e) =>
                setFormData({ ...formData, subject_id: e.target.value })
              }
              required
            >
              <option value="">Select a subject...</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="score-input">Score</label>
            <input
              id="score-input"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={formData.score}
              onChange={(e) =>
                setFormData({ ...formData, score: e.target.value })
              }
              required
              placeholder="Enter score (0-100)"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Recording...' : 'Record Evaluation'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading evaluations...</div>
      ) : (
        <div className="evaluations-list">
          {evaluations.length === 0 ? (
            <p>No evaluations recorded</p>
          ) : (
            <table className="evaluations-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Evaluated By</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((evaluation) => (
                  <tr key={evaluation.id}>
                    <td>{evaluation.dars_e_nizami_subjects?.name}</td>
                    <td>{evaluation.score}</td>
                    <td>
                      {evaluation.scholars?.profiles?.full_name || 'Unknown'}
                    </td>
                    <td>
                      {new Date(evaluation.evaluated_at).toLocaleDateString()}
                    </td>
                    <td>
                      {evaluation.flagged ? (
                        <span className="status-badge flagged">
                          Below Threshold
                        </span>
                      ) : (
                        <span className="status-badge passing">Passing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
