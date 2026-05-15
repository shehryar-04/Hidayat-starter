import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Card, CardContent, CardHeader,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Spinner, EmptyState
} from '../../shared/ui'
import { FileText } from 'lucide-react'

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

      const transcriptData = {
        student: selectedStudent,
        enrollments: enrollments || [],
        evaluations: evaluations || [],
        completedLevels: [],
      }

      if (enrollments && evaluations) {
        enrollments.forEach((enrollment) => {
          const levelEvals = evaluations.filter(
            (e) => e.level_id === enrollment.level_id
          )
          const allPassing = levelEvals.every(
            (e) =>
              e.score >= (enrollment.dars_e_nizami_levels?.passing_threshold || 50) &&
              !e.flagged
          )

          if (allPassing && levelEvals.length > 0) {
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
      <EmptyState
        icon={FileText}
        title="No student selected"
        description="Please select a student to view their transcript."
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
        {error}
      </div>
    )
  }

  if (!transcript) {
    return (
      <EmptyState
        icon={FileText}
        title="No transcript data"
        description="No transcript data available for this student."
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-neutral-800">Academic Transcript</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Student:</span>{' '}
              <span className="font-medium text-neutral-800">{transcript.student.profiles?.full_name}</span>
            </div>
            <div>
              <span className="text-neutral-500">Enrollment Number:</span>{' '}
              <span className="font-medium text-neutral-800">{transcript.student.enrollment_number}</span>
            </div>
            <div>
              <span className="text-neutral-500">Program:</span>{' '}
              <span className="font-medium text-neutral-800">Dars-e-Nizami</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {transcript.completedLevels.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No completed levels"
          description="This student has not completed any levels yet."
        />
      ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-neutral-800">Completed Levels</h3>
          {transcript.completedLevels.map((levelData, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-neutral-800">{levelData.level.name}</h4>
                  <span className="text-sm text-neutral-500">
                    Completed: {new Date(levelData.enrolledAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Evaluated By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelData.evaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>{evaluation.dars_e_nizami_subjects?.name}</TableCell>
                        <TableCell className="font-medium">{evaluation.score}</TableCell>
                        <TableCell>
                          {evaluation.scholars?.profiles?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {new Date(evaluation.evaluated_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-3 text-sm text-neutral-600">
                  <span className="font-medium">Average Score:</span>{' '}
                  {(
                    levelData.evaluations.reduce((sum, e) => sum + e.score, 0) /
                    levelData.evaluations.length
                  ).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {transcript.enrollments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-800">All Enrollments</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Enrolled Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transcript.enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>{enrollment.dars_e_nizami_levels?.name}</TableCell>
                  <TableCell>
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={enrollment.status === 'active' ? 'success' : enrollment.status === 'completed' ? 'info' : 'default'}>
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
