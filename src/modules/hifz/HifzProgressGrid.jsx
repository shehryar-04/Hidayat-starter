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
 * Fully theme-aware in Light and Dark mode.
 */
export function HifzProgressGrid({ student, onBack }) {
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hifzStatus, setHifzStatus] = useState('in_progress')
  const [auditLog, setAuditLog] = useState([])
  const [showAuditLog, setShowAuditLog] = useState(false)

  useEffect(() => {
    if (student?.id) {
      loadProgress()
    }
  }, [student?.id])

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
      const userId = user?.user?.id || user?.id || 'unknown'

      let scholar = null
      const { data: scholarData } = await supabase
        .from('scholars')
        .select('id')
        .eq('profile_id', userId)
        .single()
      scholar = scholarData

      const currentJuz = progress[juzNumber] || { status: 'not_started' }
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
          changed_by: userId,
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
              : prev[juzNumber]?.memorized_at,
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
      case 'not_started': return 'bg-neutral-50 dark:bg-[#14221b] border-neutral-200/80 dark:border-[#1a2e23]'
      case 'in_progress': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/40'
      case 'memorized': return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/50'
      case 'revised': return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-900/40'
      default: return 'bg-neutral-50 dark:bg-[#14221b] border-neutral-200/80 dark:border-[#1a2e23]'
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
      case 'not_started': return 'secondary'
      case 'in_progress': return 'warning'
      case 'memorized': return 'success'
      case 'revised': return 'info'
      default: return 'secondary'
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

      <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-white">
              Hifz Progress - {student?.profiles?.full_name}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
              Enrollment: {student?.enrollment_number}
            </p>
          </div>
          <Badge variant={hifzStatus === 'complete' ? 'success' : 'warning'}>
            {hifzStatus === 'complete' ? 'Complete' : 'In Progress'}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      {hifzStatus === 'complete' && (
        <div className="p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50">
          <p className="font-bold text-emerald-900 dark:text-emerald-200">Hifz Complete!</p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">All 30 Juz have been memorized.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNumber) => {
          const juzData = progress[juzNumber]
          const status = juzData?.status || 'not_started'

          return (
            <div
              key={juzNumber}
              className={`rounded-2xl border p-3.5 transition-all shadow-xs ${getStatusColor(status)}`}
            >
              <div className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Juz {juzNumber}</div>
              <Badge variant={getStatusBadgeVariant(status)} className="text-[10px] mb-2.5">
                {getStatusLabel(status)}
              </Badge>

              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => handleStatusChange(juzNumber, 'not_started')}
                  className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center transition-all cursor-pointer ${
                    status === 'not_started' ? 'bg-neutral-300 dark:bg-neutral-600 border-neutral-400 dark:border-neutral-500 font-bold' : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                  title="Not Started"
                  aria-label={`Mark Juz ${juzNumber} as Not Started`}
                >
                  ○
                </button>
                <button
                  onClick={() => handleStatusChange(juzNumber, 'in_progress')}
                  className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center transition-all cursor-pointer ${
                    status === 'in_progress' ? 'bg-amber-400 border-amber-500 font-bold text-amber-950' : 'border-neutral-300 dark:border-neutral-700 hover:border-amber-400'
                  }`}
                  title="In Progress"
                  aria-label={`Mark Juz ${juzNumber} as In Progress`}
                >
                  ◐
                </button>
                <button
                  onClick={() => handleStatusChange(juzNumber, 'memorized')}
                  className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center transition-all cursor-pointer ${
                    status === 'memorized' ? 'bg-emerald-500 border-emerald-600 font-bold text-white' : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-400'
                  }`}
                  title="Memorized"
                  aria-label={`Mark Juz ${juzNumber} as Memorized`}
                >
                  ●
                </button>
                <button
                  onClick={() => handleStatusChange(juzNumber, 'revised')}
                  className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center transition-all cursor-pointer ${
                    status === 'revised' ? 'bg-blue-500 border-blue-600 font-bold text-white' : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-400'
                  }`}
                  title="Revised"
                  aria-label={`Mark Juz ${juzNumber} as Revised`}
                >
                  ✓
                </button>
              </div>

              {juzData?.memorized_at && (
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
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
          <div className="space-y-3 bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] rounded-2xl p-6 shadow-xs">
            <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">Change History</h3>
            {auditLog.length === 0 ? (
              <EmptyState
                icon={History}
                title="No changes"
                description="No changes have been recorded yet."
              />
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
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
                        <TableCell className="font-semibold text-neutral-900 dark:text-white">Juz {entry.juz_number}</TableCell>
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
                        <TableCell className="font-mono text-xs">
                          {new Date(entry.changed_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default HifzProgressGrid
