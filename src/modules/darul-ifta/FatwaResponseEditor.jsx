import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Textarea, Label, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../shared/ui'

/**
 * Fatwa Response Editor Component
 * Allows Mufti to submit responses and manage fatwa workflow
 * Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
export function FatwaResponseEditor({ question, onBack, onComplete }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [responses, setResponses] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [showPublishForm, setShowPublishForm] = useState(false)
  const [anonymizeQuestioner, setAnonymizeQuestioner] = useState(false)

  useEffect(() => {
    loadUserInfo()
    loadResponses()
    loadAuditLog()
  }, [question.id])

  const loadUserInfo = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      setUserId(user.user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.user.id)
        .single()

      setUserRole(profile?.role)
    } catch (err) {
      console.error('Error loading user info:', err)
    }
  }

  const loadResponses = async () => {
    try {
      const { data, error: err } = await supabase
        .from('fatwa_responses')
        .select(
          `
          id,
          question_id,
          mufti_id,
          response_text,
          submitted_at,
          profiles:mufti_id (
            id,
            full_name
          )
        `
        )
        .eq('question_id', question.id)
        .order('submitted_at')

      if (err) throw err
      setResponses(data || [])
    } catch (err) {
      console.error('Error loading responses:', err)
    }
  }

  const loadAuditLog = async () => {
    try {
      const { data, error: err } = await supabase
        .from('fatwa_audit_log')
        .select(
          `
          id,
          question_id,
          old_status,
          new_status,
          acted_at,
          profiles:actor_id (
            id,
            full_name
          )
        `
        )
        .eq('question_id', question.id)
        .order('acted_at')

      if (err) throw err
      setAuditLog(data || [])
    } catch (err) {
      console.error('Error loading audit log:', err)
    }
  }

  const handleSubmitResponse = async (e) => {
    e.preventDefault()
    if (!response.trim()) return

    setLoading(true)
    try {
      // Insert response
      const { error: err1 } = await supabase
        .from('fatwa_responses')
        .insert({
          question_id: question.id,
          mufti_id: userId,
          response_text: response,
          submitted_at: new Date().toISOString(),
        })

      if (err1) throw err1

      // Update question status
      const { error: err2 } = await supabase
        .from('fatwa_questions')
        .update({ status: 'under_review' })
        .eq('id', question.id)

      if (err2) throw err2

      // Log to audit
      const { error: err3 } = await supabase
        .from('fatwa_audit_log')
        .insert({
          question_id: question.id,
          old_status: question.status,
          new_status: 'under_review',
          actor_id: userId,
          acted_at: new Date().toISOString(),
        })

      if (err3) throw err3

      setResponse('')
      await loadResponses()
      await loadAuditLog()
    } catch (err) {
      setError(err.message)
      console.error('Error submitting response:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePublishFatwa = async () => {
    try {
      const response = await supabase.functions.invoke('publish-fatwa', {
        body: {
          question_id: question.id,
          anonymize_questioner: anonymizeQuestioner,
          published_by: userId,
        },
      })

      if (response.error) throw response.error

      setShowPublishForm(false)
      await loadAuditLog()
      onComplete()
    } catch (err) {
      setError(err.message)
      console.error('Error publishing fatwa:', err)
    }
  }

  const statusVariant = (s) => {
    switch (s) {
      case 'published': return 'success'
      case 'pending': return 'warning'
      case 'closed': return 'default'
      case 'under_review': return 'info'
      default: return 'default'
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← Back to Questions
      </Button>

      {/* Question display card */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-neutral-800">Question: {question.reference_number}</h2>
          <Badge variant={statusVariant(question.status)} dot>
            {question.status?.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-sm text-neutral-700 leading-relaxed">{question.question_text}</p>
        {question.context && (
          <p className="text-sm text-neutral-500 mt-3">
            <span className="font-semibold">Context:</span> {question.context}
          </p>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">{error}</div>}

      {/* Display existing responses */}
      {responses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-800">Responses</h3>
          {responses.map((resp) => (
            <div key={resp.id} className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-neutral-800">{resp.profiles?.full_name}</span>
                <span className="text-xs text-neutral-400">
                  {new Date(resp.submitted_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed">{resp.response_text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Response form for Mufti */}
      {(userRole === 'mufti' || userRole === 'admin') &&
        question.status !== 'published' && (
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Submit Fatwa Response</h3>
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter your fatwa response..."
                  rows={6}
                />
              </div>
              <Button type="submit" variant="primary" disabled={loading || !response.trim()} loading={loading}>
                Submit Response
              </Button>
            </form>
          </div>
        )}

      {/* Publish form for Admin */}
      {userRole === 'admin' && question.status === 'under_review' && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          {!showPublishForm ? (
            <Button variant="primary" onClick={() => setShowPublishForm(true)}>
              Approve & Publish Fatwa
            </Button>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handlePublishFatwa() }} className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  id="anonymize"
                  type="checkbox"
                  checked={anonymizeQuestioner}
                  onChange={(e) => setAnonymizeQuestioner(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                <Label htmlFor="anonymize">Anonymize Questioner</Label>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary" disabled={loading} loading={loading}>
                  Publish Fatwa
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowPublishForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Audit log */}
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => setShowAuditLog(!showAuditLog)}>
          {showAuditLog ? 'Hide' : 'Show'} Audit Log
        </Button>

        {showAuditLog && (
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Status History</h3>
            {auditLog.length === 0 ? (
              <p className="text-sm text-neutral-400">No status changes recorded</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Old Status</TableHead>
                    <TableHead>New Status</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.old_status || 'N/A'}</TableCell>
                      <TableCell>{entry.new_status}</TableCell>
                      <TableCell>{entry.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>{new Date(entry.acted_at).toLocaleDateString()}</TableCell>
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
