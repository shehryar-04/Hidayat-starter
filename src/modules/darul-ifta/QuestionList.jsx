import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Badge, Spinner, EmptyState } from '../../shared/ui'
import { Scale } from 'lucide-react'

const STATUS_VARIANT = {
  pending: 'warning',
  assigned: 'info',
  under_review: 'default',
  approved: 'success',
  published: 'success',
  closed: 'error',
}

/**
 * Question List Component
 * Displays fatwa questions with filtering by status
 * Requirements: 8.1, 8.2, 8.3
 */
export function QuestionList({ onSelectQuestion }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    loadUserRole()
    loadQuestions()
  }, [statusFilter])

  const loadUserRole = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.user.id)
        .single()

      setUserRole(profile?.role)
    } catch (err) {
      console.error('Error loading user role:', err)
    }
  }

  const loadQuestions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('fatwa_questions')
        .select(
          `
          id,
          reference_number,
          submitted_by,
          question_text,
          context,
          status,
          assigned_mufti,
          duplicate_of,
          created_at,
          profiles:submitted_by (
            id,
            full_name
          ),
          assigned_profiles:assigned_mufti (
            id,
            full_name
          )
        `
        )

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error: err } = await query.order('created_at', {
        ascending: false,
      })

      if (err) throw err
      setQuestions(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToMufti = async (questionId, muftiId) => {
    try {
      const { data: user } = await supabase.auth.getUser()

      const { error: err1 } = await supabase
        .from('fatwa_questions')
        .update({
          assigned_mufti: muftiId,
          status: 'assigned',
        })
        .eq('id', questionId)

      if (err1) throw err1

      const { error: err2 } = await supabase
        .from('fatwa_audit_log')
        .insert({
          question_id: questionId,
          old_status: 'pending',
          new_status: 'assigned',
          actor_id: user.user.id,
          acted_at: new Date().toISOString(),
        })

      if (err2) throw err2

      await loadQuestions()
    } catch (err) {
      setError(err.message)
      console.error('Error assigning question:', err)
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
      <h2 className="text-xl font-semibold text-neutral-800">Fatwa Questions</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3" role="alert">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label htmlFor="status-filter" className="text-sm font-medium text-neutral-700">Filter by Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No questions found"
            description="No fatwa questions match the current filter."
          />
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className={`bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden border-l-4 border-l-${STATUS_VARIANT[question.status] === 'warning' ? 'amber-400' : STATUS_VARIANT[question.status] === 'info' ? 'blue-400' : STATUS_VARIANT[question.status] === 'success' ? 'green-400' : STATUS_VARIANT[question.status] === 'error' ? 'red-400' : 'neutral-300'}`}
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-neutral-500">
                      {question.reference_number}
                    </span>
                    <Badge variant={STATUS_VARIANT[question.status] || 'default'}>
                      {question.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(question.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm font-medium text-neutral-800 mb-1">{question.question_text}</p>
                {question.context && (
                  <p className="text-xs text-neutral-500 mt-1">
                    <span className="font-semibold">Context:</span> {question.context}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                  <div className="text-xs text-neutral-500 space-y-0.5">
                    <p>Submitted by: {question.profiles?.full_name || 'Anonymous'}</p>
                    {question.assigned_profiles && (
                      <p>Assigned to: {question.assigned_profiles.full_name}</p>
                    )}
                  </div>

                  {(userRole === 'admin' || userRole === 'mufti') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectQuestion(question)}
                    >
                      {question.status === 'pending' ? 'Assign & Respond' : 'View'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
