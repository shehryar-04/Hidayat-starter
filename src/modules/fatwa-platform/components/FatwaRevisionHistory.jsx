import { useState, useEffect } from 'react'
import { Clock, User, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Spinner, Badge } from '../../../shared/ui'

/**
 * FatwaRevisionHistory — Shows edit history for a single fatwa.
 * Visible to admins and muftis.
 */
export default function FatwaRevisionHistory({ fatwaId }) {
  const [revisions, setRevisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!fatwaId) return
    loadRevisions()
  }, [fatwaId])

  const loadRevisions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fatwa_revisions')
      .select('*')
      .eq('fatwa_id', fatwaId)
      .order('revision_number', { ascending: false })

    setRevisions(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Spinner size="sm" />
        <span className="text-sm text-gray-500">Loading revision history...</span>
      </div>
    )
  }

  if (revisions.length === 0) {
    return (
      <div className="py-4 text-sm text-gray-400 italic">
        No revisions recorded yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Clock size={16} />
        Revision History ({revisions.length})
      </h3>

      <div className="space-y-1">
        {revisions.map((rev) => (
          <div
            key={rev.id}
            className="border border-gray-100 rounded-lg bg-white"
          >
            <button
              onClick={() => setExpanded(expanded === rev.id ? null : rev.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  v{rev.revision_number}
                </Badge>
                <span className="text-sm text-gray-700 font-medium">
                  {rev.change_summary || 'Edit'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {new Date(rev.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                {expanded === rev.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {expanded === rev.id && (
              <div className="px-4 pb-3 pt-1 border-t border-gray-50 space-y-2">
                {rev.title && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Title:</span>
                    <p className="text-sm text-gray-700 mt-0.5">{rev.title}</p>
                  </div>
                )}
                {rev.answer && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Answer (excerpt):</span>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-4 whitespace-pre-wrap">
                      {rev.answer.slice(0, 500)}
                      {rev.answer.length > 500 && '...'}
                    </p>
                  </div>
                )}
                {rev.category_1 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    Category: {[rev.category_1, rev.category_2, rev.category_3].filter(Boolean).join(' > ')}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
