import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Approval Queue Component
 * Allows admin to approve or reject publications
 * Requirements: 9.2, 9.3
 */
export function ApprovalQueue() {
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    loadUserRole()
    loadPendingPublications()
  }, [])

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

  const loadPendingPublications = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('publications')
        .select(
          `
          id,
          title,
          abstract,
          authors,
          publication_type,
          file_path,
          status,
          submitted_by,
          submitted_at,
          profiles:submitted_by (
            id,
            full_name
          )
        `
        )
        .eq('status', 'under_review')
        .order('submitted_at')

      if (err) throw err
      setPublications(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading publications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (publicationId) => {
    try {
      const { error: err } = await supabase
        .from('publications')
        .update({ status: 'published' })
        .eq('id', publicationId)

      if (err) throw err
      await loadPendingPublications()
    } catch (err) {
      setError(err.message)
      console.error('Error approving publication:', err)
    }
  }

  const handleReject = async (publicationId) => {
    try {
      const { error: err } = await supabase
        .from('publications')
        .update({ status: 'rejected' })
        .eq('id', publicationId)

      if (err) throw err
      await loadPendingPublications()
    } catch (err) {
      setError(err.message)
      console.error('Error rejecting publication:', err)
    }
  }

  if (userRole !== 'admin') {
    return (
      <div className="approval-queue">
        <p>You do not have permission to access this section.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading publications...</div>
  }

  return (
    <div className="approval-queue">
      <h2>Publication Approval Queue</h2>

      {error && <div className="error-message">{error}</div>}

      {publications.length === 0 ? (
        <p>No publications pending approval</p>
      ) : (
        <div className="publications-queue">
          {publications.map((pub) => (
            <div key={pub.id} className="publication-item">
              <div className="publication-info">
                <h3>{pub.title}</h3>
                {pub.abstract && (
                  <p className="abstract">{pub.abstract}</p>
                )}
                <div className="meta">
                  <small>
                    <strong>Authors:</strong> {pub.authors?.join(', ')}
                  </small>
                  <small>
                    <strong>Type:</strong> {pub.publication_type}
                  </small>
                  <small>
                    <strong>Submitted by:</strong> {pub.profiles?.full_name}
                  </small>
                  <small>
                    <strong>Date:</strong>{' '}
                    {new Date(pub.submitted_at).toLocaleDateString()}
                  </small>
                </div>
              </div>

              <div className="publication-actions">
                <button
                  onClick={() => handleApprove(pub.id)}
                  className="approve-button"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(pub.id)}
                  className="reject-button"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
