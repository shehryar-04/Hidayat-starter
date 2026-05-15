import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Button, Card, CardContent,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Spinner, EmptyState
} from '../../shared/ui'
import { ArrowLeft, History } from 'lucide-react'

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
      const { data, error: err } = await supabase
        .from('hifz_progress')
        .select('*')
        .eq('student_id', student.id)

      if (err) throw err

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
      case 'not_started': return 'bg-neutral-100'
      case 'in_progress': return 'bg-amber-50'
      case 'memorized': return 'bg-green-50'
      case 'revised': return 'bg-blue-50'
      default: return 'bg-neutral-100'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'not_started': return 'Not Started'
      case 'in_progress': return 'In Progress'
      case 'memorized': return 'Memorized'
      case 'revised': return 'Revised'
      default: return status
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'not_started': return 'default'
      case 'in_progress': return 'warning'
      case 'memorized': return 'success'
      case 'revised': return 'info'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} size="sm">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Search
      </Button>

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-800">
                Hifz Progress - {student.profiles?.full_name}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Enrollment: {student.enrollment_number}
              </p>
            </div>
            <Badge variant={hifzStatus === 'complete' ? 'success' : 'warning'} dot>
              {hifzStatus === 'complete' ? 'Complete' : 'In Progress'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3" role="alert">
          {error}
        </div>
      )}

      {hifzStatus === 'complete' && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent>
            <p className="font-semibold text-green-800">Hifz Complete!</p>
            <p className="text-sm text-green-700">All 30 Juz have been memorized.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNumber) => {
          const juzData = progress[juzNumber]
          const status = juzData?.status || 'not_started'

          return (
            <div
              key={juzNumber}
              className={`rounded-xl border border-neutral-200 p-3 ${getStatusColor(status)} transition-all`}
            >
              <div className="text-sm font-semibold text-neutral-700 mb-1">Juz {juzNumber}</div>
              <Badge variant={getStatusBadgeVariant(status)} className="text-[10px] mb-2">
                {getStatusLabel(status)}
              </Badge>

              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => handleStatusChange(juzNumber, 'not_started')}
                  className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center transition-all ${
                    status === 'not_started' ? 'bg-neutral-300 border-neutral-400' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                  title="Not Started"
                  aria-label={`Mark Juz ${juzNumber} as Not Started`}
                >
                  ○
                </button>
                <button
                  onClick={() => handleStatusChange(juzNumber, 'in_progress')}
                  className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center transition-all ${
                    status === 'in_progress' ? 'bg-amber-300 border-amber-400' : 'border-neutral-200 hover:border-amber-400'
                  }`}
                  title="In Progress"
                  aria-label={`Mark Juz ${juzNumber} as In Progress`}
                >
                  ◐
                </button>
                <button
                  onClick={() => handleStatusChange(juzNumber, 'memorized')}
                  className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center transition-all ${
                    status === 'memorized' ? 'bg-green-300 border-green-400' : 'border-neutral-200 hover:border-green-400'
                  }`}
                  title="Memorized"
                  aria-label={`Mark Juz ${juzNumber} as Memorized`}
                >
                  ●
                </button>
                <button
                  onClick={() => handleStatusChange(juzNumber, 'revised')}
                  className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center transition-all ${
                    status === 'revised' ? 'bg-blue-300 border-blue-400' : 'border-neutral-200 hover:border-blue-400'
                  }`}
                  title="Revised"
                  aria-label={`Mark Juz ${juzNumber} as Revised`}
                >
                  ✓
                </button>
              </div>

              {juzData?.memorized_at && (
                <p className="text-[10px] text-neutral-500 mt-1">
                  {new Date(juzData.memorized_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setShowAuditLog(!showAuditLog)}
          size="sm"
        >
          <History className="w-4 h-4 mr-2" />
          {showAuditLog ? 'Hide' : 'Show'} Audit Log
        </Button>

        {showAuditLog && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-800">Change History</h3>
            {auditLog.length === 0 ? (
              <EmptyState
                icon={History}
                title="No changes"
                description="No changes have been recorded yet."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Juz</TableHead>
                    <TableHead>Old Status</TableHead>
                    <TableHead>New Status</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>Juz {entry.juz_number}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(entry.old_status)}>
                          {getStatusLabel(entry.old_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(entry.new_status)}>
                          {getStatusLabel(entry.new_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>
                        {new Date(entry.changed_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
