import { useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Nazra Student Search Component
 * Searches for students to track their Nazra progress
 * Requirements: 6.1
 */
export function NazraStudentSearch({ onSelectStudent }) {
  const [searchName, setSearchName] = useState('')
  const [searchEnrollment, setSearchEnrollment] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('students')
        .select(
          `
          id,
          enrollment_number,
          profile_id,
          status,
          profiles:profile_id (
            id,
            full_name
          )
        `
        )
        .eq('status', 'active')

      if (searchName) {
        query = query.ilike('profiles.full_name', `%${searchName}%`)
      }

      if (searchEnrollment) {
        query = query.ilike('enrollment_number', `%${searchEnrollment}%`)
      }

      const { data, error: err } = await query.limit(50)

      if (err) throw err
      setResults(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="nazra-student-search">
      <form onSubmit={handleSearch} className="search-form">
        <div className="form-group">
          <label htmlFor="search-name">Student Name</label>
          <input
            id="search-name"
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="search-enrollment">Enrollment Number</label>
          <input
            id="search-enrollment"
            type="text"
            placeholder="Search by enrollment number..."
            value={searchEnrollment}
            onChange={(e) => setSearchEnrollment(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="search-results">
        {results.length === 0 && !loading && (
          <p className="no-results">No students found</p>
        )}

        {results.map((student) => (
          <div
            key={student.id}
            className="student-card"
            onClick={() => onSelectStudent(student)}
          >
            <div className="student-info">
              <h3>{student.profiles?.full_name}</h3>
              <p>Enrollment: {student.enrollment_number}</p>
            </div>
            <button className="select-button">Track Progress</button>
          </div>
        ))}
      </div>
    </div>
  )
}
