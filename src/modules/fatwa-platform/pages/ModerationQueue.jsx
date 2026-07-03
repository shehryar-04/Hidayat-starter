import { useState, useEffect, useCallback } from 'react'
import { Shield, Check, X, Flag, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Button, Badge, Spinner, Card, CardContent, EmptyState, PageWrapper, PageHeader } from '../../../shared/ui'

const STATUS_COLORS = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  flagged: 'bg-orange-100 text-orange-800',
  spam: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  flagged: 'Flagged',
  spam: 'Spam',
}

/**
 * ModerationQueue — Admin/Mufti view for moderating submitted questions.
 */
export default function ModerationQueue() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending_review')
  const [processing, setProcessing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('fatwa_questions')
      .select('id, question_text, context, submitted_by, created_at, moderation_status, moderation_reason, flag_count, title, reference_number')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter !== 'all') {
      query = query.eq('moderation_status', filter)
    }

    const { data } = await query
    setQuestions(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const moderateAction = async (questionId, action, reason = '') => {
    setProcessing(questionId)
    const { data: { user } } = await supabase.auth.getUser()

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      flag: 'flagged',
      mark_spam: 'spam',
      delete: null,
      restore: 'pending_review',
    }

    if (action === 'delete') {
      await supabase
        .from('fatwa_questions')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user.id })
        .eq('id', questionId)
    } else {
      const updates = {
        moderation_status: statusMap[action],
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
      }
      if (reason) updates.moderation_reason = reason
      if (action === 'flag') {
        // Increment flag count
        const q = questions.find(q => q.id === questionId)
        updates.flag_count = (q?.flag_count || 0) + 1
      }
      await supabase
        .from('fatwa_questions')
        .update(updates)
        .eq('id', questionId)
    }

    // Log the action
    await supabase.from('moderation_log').insert({
      question_id: questionId,
      action,
      reason: reason || null,
      actor_id: user.id,
    })

    setProcessing(null)
    load()
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Content Moderation"
        description="Review and moderate submitted questions before they reach the Mufti queue."
        icon={<Shield className="text-primary" />}
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['pending_review', 'flagged', 'approved', 'rejected', 'spam', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f] || f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions to moderate"
          description="All submitted questions have been reviewed."
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.moderation_status]}`}>
                        {STATUS_LABELS[q.moderation_status]}
                      </span>
                      {q.flag_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <Flag size={10} className="mr-1" /> {q.flag_count}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {q.reference_number}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-3 whitespace-pre-wrap">
                      {q.question_text}
                    </p>
                    {q.context && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        Context: {q.context}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted {new Date(q.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {q.moderation_status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:bg-green-50 text-xs"
                        disabled={processing === q.id}
                        onClick={() => moderateAction(q.id, 'approve')}
                      >
                        <Check size={14} className="mr-1" /> Approve
                      </Button>
                    )}
                    {q.moderation_status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 text-xs"
                        disabled={processing === q.id}
                        onClick={() => moderateAction(q.id, 'reject', 'Content policy violation')}
                      >
                        <X size={14} className="mr-1" /> Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-orange-600 hover:bg-orange-50 text-xs"
                      disabled={processing === q.id}
                      onClick={() => moderateAction(q.id, 'flag', 'Needs further review')}
                    >
                      <Flag size={14} className="mr-1" /> Flag
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-500 hover:bg-gray-50 text-xs"
                      disabled={processing === q.id}
                      onClick={() => moderateAction(q.id, 'delete')}
                    >
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
