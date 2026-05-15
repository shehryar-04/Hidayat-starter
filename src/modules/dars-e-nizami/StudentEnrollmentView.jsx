import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Button, Card, CardContent,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Spinner, EmptyState, Modal
} from '../../shared/ui'
import { Users } from 'lucide-react'

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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-800">Student Enrollments</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3" role="alert">
          {error}
        </div>
      )}

      <Button
        onClick={() => setShowEnrollmentForm(!showEnrollmentForm)}
        variant={showEnrollmentForm ? 'outline' : 'primary'}
      >
        {showEnrollmentForm ? 'Cancel' : 'Enroll Student'}
      </Button>

      <Modal open={showEnrollmentForm} onClose={() => setShowEnrollmentForm(false)} size="sm">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Enroll Student</h3>
        <form onSubmit={handleEnroll} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="student-select" className="text-sm font-medium text-neutral-700">Student</label>
            <select
              id="student-select"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
              className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.profiles?.full_name} ({student.enrollment_number})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="level-select" className="text-sm font-medium text-neutral-700">Academic Level</label>
            <select
              id="level-select"
              value={formData.level_id}
              onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
              required
              className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a level...</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Enroll
          </Button>
        </form>
      </Modal>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div>
          {enrollments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No enrollments"
              description="No students have been enrolled yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Enrollment Number</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Enrolled Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow
                    key={enrollment.id}
                    onClick={() => onSelectStudent(enrollment.students)}
                    className="cursor-pointer"
                  >
                    <TableCell>{enrollment.students?.profiles?.full_name}</TableCell>
                    <TableCell>{enrollment.students?.enrollment_number}</TableCell>
                    <TableCell>{enrollment.dars_e_nizami_levels?.name}</TableCell>
                    <TableCell>
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={enrollment.status === 'active' ? 'success' : 'default'}>
                        {enrollment.status}
                      </Badge>
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
