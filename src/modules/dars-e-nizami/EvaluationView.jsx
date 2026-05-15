import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Button, Input, Card, CardContent,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Spinner, EmptyState, Modal
} from '../../shared/ui'
import { ClipboardList } from 'lucide-react'

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
      const { data: levelSubjects, error: err1 } = await supabase
        .from('dars_e_nizami_subjects')
        .select('id')
        .eq('level_id', selectedLevel.id)

      if (err1) throw err1

      if (!levelSubjects || levelSubjects.length === 0) {
        setLevelCompletion(null)
        return
      }

      const { data: evals, error: err2 } = await supabase
        .from('evaluations')
        .select('subject_id, score, flagged')
        .eq('student_id', selectedStudent.id)
        .eq('level_id', selectedLevel.id)

      if (err2) throw err2

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
      <EmptyState
        icon={ClipboardList}
        title="No selection"
        description="Please select a student and level to view evaluations."
      />
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-800">
        Evaluations for {selectedStudent.profiles?.full_name} - {selectedLevel.name}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3" role="alert">
          {error}
        </div>
      )}

      {levelCompletion === 'complete' && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-green-800">Level Complete!</p>
                <p className="text-sm text-green-700">This student has passed all subjects and is eligible for promotion.</p>
              </div>
              <Button
                onClick={handlePromoteStudent}
                loading={loading}
                variant="primary"
              >
                Promote to Next Level
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setShowEvaluationForm(!showEvaluationForm)}
        variant={showEvaluationForm ? 'outline' : 'primary'}
      >
        {showEvaluationForm ? 'Cancel' : 'Record Evaluation'}
      </Button>

      <Modal open={showEvaluationForm} onClose={() => setShowEvaluationForm(false)} size="sm">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Record Evaluation</h3>
        <form onSubmit={handleRecordEvaluation} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="subject-select" className="text-sm font-medium text-neutral-700">Subject</label>
            <select
              id="subject-select"
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              required
              className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a subject...</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="score-input" className="text-sm font-medium text-neutral-700">Score</label>
            <Input
              id="score-input"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              required
              placeholder="Enter score (0-100)"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Record Evaluation
          </Button>
        </form>
      </Modal>

      {loading && !showEvaluationForm ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div>
          {evaluations.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No evaluations"
              description="No evaluations have been recorded yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Evaluated By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>{evaluation.dars_e_nizami_subjects?.name}</TableCell>
                    <TableCell>{evaluation.score}</TableCell>
                    <TableCell>
                      {evaluation.scholars?.profiles?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {new Date(evaluation.evaluated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {evaluation.flagged ? (
                        <Badge variant="error">Below Threshold</Badge>
                      ) : (
                        <Badge variant="success">Passing</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
