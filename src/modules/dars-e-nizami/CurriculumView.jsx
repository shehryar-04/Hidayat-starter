import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, Badge, Spinner, EmptyState } from '../../shared/ui'
import { BookOpen } from 'lucide-react'

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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-800">Curriculum Structure</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-neutral-700">Academic Levels</h3>
            {levels.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No levels configured"
                description="Academic levels have not been set up yet."
              />
            ) : (
              <div className="space-y-2">
                {levels.map((level) => (
                  <Card
                    key={level.id}
                    interactive
                    className={selectedLevel?.id === level.id ? 'ring-2 ring-primary-500' : ''}
                    onClick={() => handleSelectLevel(level)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-neutral-800">{level.name}</span>
                        <Badge variant="info">Passing: {level.passing_threshold}%</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {selectedLevel && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-neutral-700">Subjects in {selectedLevel.name}</h3>
              {subjects.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No subjects"
                  description="No subjects in this level yet."
                />
              ) : (
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <Card key={subject.id}>
                      <CardContent className="py-3">
                        <span className="text-neutral-700">{subject.name}</span>
                      </CardContent>
                    </Card>
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
