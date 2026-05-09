import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Student Enrollment View Component
 * Manages student enrollment in Dars-e-Nizami levels
 * Requirements: 4.2, 4.3
 */
export function StudentEnrollmentView({ selectedLevel, onSelectStudent }) {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [levels, setLevels] = useState([])
  const [students, setStudents] = useState([])
  const [formData, setFormData] = useState({
    student_id: '',
    level_id: '',
  })

  useEffect(() => {
    loadEnrollments()
    loadLevels()
    loadStudents()
  }, [selectedLevel])

  const loadEnrollments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('student_enrollments')
        .select(
          `
          id,
          student_id,
          program,
          level_id,
          enrolled_at,
          status,
          students:student_id (
            id,
            enrollment_number,
            profile_id,
            profiles:profile_id (
              id,
              full_name
            )
          ),
          dars_e_nizami_levels:level_id (
            id,
            name
          )
        `
        )
        .eq('program', 'dars_e_nizami')

      if (selectedLevel) {
        query = query.eq('level_id', selectedLevel.id)
      }

      const { data, error: err } = await query.order('enrolled_at', {
        ascending: false,
      })

      if (err) throw err
      setEnrollments(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading enrollments:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadLevels = async () => {
    try {
      const { data, error: err } = await supabase
        .from('dars_e_nizami_levels')
        .select('*')
        .order('sequence_order')

      if (err) throw err
      setLevels(data || [])
    } catch (err) {
      console.error('Error loading levels:', err)
    }
  }

  const loadStudents = async () => {
    try {
      const { data, error: err } = await supabase
        .from('students')
        .select(
          `
          id,
          enrollment_number,
          profile_id,
          profiles:profile_id (
            id,
            full_name
          )
        `
        )
        .eq('status', 'active')
        .order('enrollment_number')

      if (err) throw err
      setStudents(data || [])
    } catch (err) {
      console.error('Error loading students:', err)
    }
  }

  const handleEnroll = async (e) => {
    e.preventDefault()
    if (!formData.student_id || !formData.level_id) return

    setLoading(true)
    try {
      const { error: err } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: formData.student_id,
          program: 'dars_e_nizami',
          level_id: formData.level_id,
          enrolled_at: new Date().toISOString().split('T')[0],
          status: 'active',
        })

      if (err) throw err

      setFormData({ student_id: '', level_id: '' })
      setShowEnrollmentForm(false)
      await loadEnrollments()
    } catch (err) {
      setError(err.message)
      console.error('Error enrolling student:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="enrollment-view">
      <h2>Student Enrollments</h2>

      {error && <div className="error-message">{error}</div>}

      <button
        onClick={() => setShowEnrollmentForm(!showEnrollmentForm)}
        className="add-enrollment-button"
      >
        {showEnrollmentForm ? 'Cancel' : 'Enroll Student'}
      </button>

      {showEnrollmentForm && (
        <form onSubmit={handleEnroll} className="enrollment-form">
          <div className="form-group">
            <label htmlFor="student-select">Student</label>
            <select
              id="student-select"
              value={formData.student_id}
              onChange={(e) =>
                setFormData({ ...formData, student_id: e.target.value })
              }
              required
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.profiles?.full_name} ({student.enrollment_number})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="level-select">Academic Level</label>
            <select
              id="level-select"
              value={formData.level_id}
              onChange={(e) =>
                setFormData({ ...formData, level_id: e.target.value })
              }
              required
            >
              <option value="">Select a level...</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Enrolling...' : 'Enroll'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading enrollments...</div>
      ) : (
        <div className="enrollments-list">
          {enrollments.length === 0 ? (
            <p>No enrollments found</p>
          ) : (
            <table className="enrollments-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Enrollment Number</th>
                  <th>Level</th>
                  <th>Enrolled Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    onClick={() => onSelectStudent(enrollment.students)}
                    className="clickable-row"
                  >
                    <td>{enrollment.students?.profiles?.full_name}</td>
                    <td>{enrollment.students?.enrollment_number}</td>
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
          )}
        </div>
      )}
    </div>
  )
}
