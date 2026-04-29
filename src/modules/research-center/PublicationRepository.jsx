import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Publication Repository Component
 * Displays published publications with search and download tracking
 * Requirements: 9.3, 9.4, 9.6
 */
export function PublicationRepository() {
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTitle, setSearchTitle] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [publicationType, setPublicationType] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    loadPublications()
  }, [])

  const loadPublications = async () => {
    setLoading(true)
    try {
      let query = supabase
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
          download_count,
          profiles:submitted_by (
            id,
            full_name
          )
        `
        )
        .eq('status', 'published')

      const { data, error: err } = await query.order('submitted_at', {
        ascending: false,
      })

      if (err) throw err
      setPublications(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading publications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let query = supabase
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
          download_count,
          profiles:submitted_by (
            id,
            full_name
          )
        `
        )
        .eq('status', 'published')

      if (searchTitle) {
        query = query.ilike('title', `%${searchTitle}%`)
      }

      if (publicationType) {
        query = query.eq('publication_type', publicationType)
      }

      const { data, error: err } = await query.order('submitted_at', {
        ascending: false,
      })

      if (err) throw err

      // Filter by author and date range in memory
      let filtered = data || []

      if (searchAuthor) {
        filtered = filtered.filter((pub) =>
          pub.authors?.some((author) =>
            author.toLowerCase().includes(searchAuthor.toLowerCase())
          )
        )
      }

      if (dateRange.start) {
        const startDate = new Date(dateRange.start)
        filtered = filtered.filter(
          (pub) => new Date(pub.submitted_at) >= startDate
        )
      }

      if (dateRange.end) {
        const endDate = new Date(dateRange.end)
        filtered = filtered.filter(
          (pub) => new Date(pub.submitted_at) <= endDate
        )
      }

      setPublications(filtered)
    } catch (err) {
      setError(err.message)
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (publication) => {
    try {
      // Increment download count
      const { error: err } = await supabase
        .from('publications')
        .update({ download_count: (publication.download_count || 0) + 1 })
        .eq('id', publication.id)

      if (err) throw err

      // Download file
      if (publication.file_path) {
        const { data, error: downloadErr } = await supabase.storage
          .from('publications')
          .download(publication.file_path)

        if (downloadErr) throw downloadErr

        const url = URL.createObjectURL(data)
        const link = document.createElement('a')
        link.href = url
        link.download = publication.title
        link.click()
        URL.revokeObjectURL(url)
      }

      // Refresh publications to show updated download count
      await loadPublications()
    } catch (err) {
      setError(err.message)
      console.error('Error downloading publication:', err)
    }
  }

  return (
    <div className="publication-repository">
      <h2>Publication Repository</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSearch} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="search-title">Title</label>
            <input
              id="search-title"
              type="text"
              placeholder="Search by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="search-author">Author</label>
            <input
              id="search-author"
              type="text"
              placeholder="Search by author..."
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="publication-type">Type</label>
            <select
              id="publication-type"
              value={publicationType}
              onChange={(e) => setPublicationType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="paper">Research Paper</option>
              <option value="book">Book</option>
              <option value="article">Article</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date-start">From Date</label>
            <input
              id="date-start"
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="date-end">To Date</label>
            <input
              id="date-end"
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {loading ? (
        <div className="loading">Loading publications...</div>
      ) : (
        <div className="publications-list">
          {publications.length === 0 ? (
            <p>No publications found</p>
          ) : (
            publications.map((pub) => (
              <div key={pub.id} className="publication-card">
                <div className="publication-header">
                  <h3>{pub.title}</h3>
                  <span className="publication-type">{pub.publication_type}</span>
                </div>

                {pub.abstract && (
                  <p className="publication-abstract">{pub.abstract}</p>
                )}

                <div className="publication-meta">
                  <div className="meta-item">
                    <strong>Authors:</strong>{' '}
                    {pub.authors?.join(', ') || 'Unknown'}
                  </div>
                  <div className="meta-item">
                    <strong>Submitted by:</strong>{' '}
                    {pub.profiles?.full_name || 'Unknown'}
                  </div>
                  <div className="meta-item">
                    <strong>Date:</strong>{' '}
                    {new Date(pub.submitted_at).toLocaleDateString()}
                  </div>
                  <div className="meta-item">
                    <strong>Downloads:</strong> {pub.download_count || 0}
                  </div>
                </div>

                {pub.file_path && (
                  <button
                    onClick={() => handleDownload(pub)}
                    className="download-button"
                  >
                    Download
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
