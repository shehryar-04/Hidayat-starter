import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle2, Eye } from 'lucide-react'
import { Button } from '../../shared/ui'

/**
 * Approval Queue — admin only.
 * Shows publications pending review with approve/reject actions.
 */
export function ApprovalQueue() {
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { loadPending() }, [])

  const loadPending = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('publications')
        .select(`
          id, title, abstract, authors, publication_type,
          file_path, status, submitted_by, submitted_at,
          profiles:submitted_by ( id, full_name )
        `)
        .eq('status', 'under_review')
        .order('submitted_at')

      if (err) throw err
      setPublications(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, newStatus) => {
    try {
      const { error: err } = await supabase
        .from('publications')
        .update({ status: newStatus })
        .eq('id', id)

      if (err) throw err
      await loadPending()
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePreview = (publication) => {
    if (publication.file_path) {
      const { data } = supabase.storage
        .from('research-publications')
        .getPublicUrl(publication.file_path)

      if (data?.publicUrl) window.open(data.publicUrl, '_blank')
    }
  }

  const typeLabel = (t) => {
    const map = { paper: 'Research Paper', book: 'Book', article: 'Article', thesis: 'Thesis' }
    return map[t] || t
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading approval queue…</div>

  return (
    <div>
      {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>}

      {publications.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
          <p className="text-gray-500 font-medium">No publications pending approval</p>
          <p className="text-gray-400 text-sm mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-2">{publications.length} publication(s) awaiting review</p>

          {publications.map(pub => (
            <div key={pub.id} className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex flex-col sm:flex-row gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-serif font-semibold text-primary text-lg truncate">{pub.title}</h3>
                  <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">{typeLabel(pub.publication_type)}</span>
                </div>

                {pub.abstract && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{pub.abstract}</p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span><span className="font-medium text-gray-600">Authors:</span> {pub.authors?.join(', ') || '—'}</span>
                  <span><span className="font-medium text-gray-600">Submitted by:</span> {pub.profiles?.full_name || '—'}</span>
                  <span><span className="font-medium text-gray-600">Date:</span> {new Date(pub.submitted_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 sm:items-end justify-end shrink-0">
                {pub.file_path && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(pub)}
                    className="text-xs flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAction(pub.id, 'published')}
                  className="text-xs"
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction(pub.id, 'rejected')}
                  className="text-xs"
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
