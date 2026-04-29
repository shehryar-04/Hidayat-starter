import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Curriculum View Component
 * Displays curriculum levels and subjects
 * Requirements: 4.1
 */
export function CurriculumView({ onSelectLevel }) {
  const [levels, setLevels] = useState([])
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadLevels()
  }, [])

  const loadLevels = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('dars_e_nizami_levels')
        .select('*')
        .order('sequence_order')

      if (err) throw err
      setLevels(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading levels:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLevel = async (level) => {
    setSelectedLevel(level)
    onSelectLevel(level)

    try {
      const { data, error: err } = await supabase
        .from('dars_e_nizami_subjects')
        .select('*')
        .eq('level_id', level.id)
        .order('name')

      if (err) throw err
      setSubjects(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading subjects:', err)
    }
  }

  return (
    <div className="curriculum-view">
      <h2>Curriculum Structure</h2>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading curriculum...</div>
      ) : (
        <div className="curriculum-grid">
          <div className="levels-list">
            <h3>Academic Levels</h3>
            {levels.length === 0 ? (
              <p>No levels configured</p>
            ) : (
              <div className="level-items">
                {levels.map((level) => (
                  <div
                    key={level.id}
                    className={`level-item ${
                      selectedLevel?.id === level.id ? 'selected' : ''
                    }`}
                    onClick={() => handleSelectLevel(level)}
                  >
                    <div className="level-name">{level.name}</div>
                    <div className="level-meta">
                      <small>Passing: {level.passing_threshold}%</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedLevel && (
            <div className="subjects-list">
              <h3>Subjects in {selectedLevel.name}</h3>
              {subjects.length === 0 ? (
                <p>No subjects in this level</p>
              ) : (
                <div className="subject-items">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="subject-item">
                      <div className="subject-name">{subject.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
