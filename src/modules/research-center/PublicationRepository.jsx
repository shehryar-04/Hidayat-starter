import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Publication Repository — public-facing list of published research.
 * Anyone (including guests) can browse and download PDFs.
 */
export function PublicationRepository() {
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTitle, setSearchTitle] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [publicationType, setPublicationType] = useState('')

  useEffect(() => { loadPublications() }, [])

  const loadPublications = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('publications')
        .select(`
          id, title, abstract, authors, publication_type,
          file_path, status, submitted_by, submitted_at, download_count,
          profiles:submitted_by ( id, full_name )
        `)
        .eq('status', 'published')
        .order('submitted_at', { ascending: false })

      if (err) throw err
      setPublications(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Client-side filter from already-loaded data
    loadFilteredPublications()
  }

  const loadFilteredPublications = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('publications')
        .select(`
          id, title, abstract, authors, publication_type,
          file_path, status, submitted_by, submitted_at, download_count,
          profiles:submitted_by ( id, full_name )
        `)
        .eq('status', 'published')

      if (searchTitle) query = query.ilike('title', `%${searchTitle}%`)
      if (publicationType) query = query.eq('publication_type', publicationType)

      const { data, error: err } = await query.order('submitted_at', { ascending: false })
      if (err) throw err

      let filtered = data || []
      if (searchAuthor) {
        filtered = filtered.filter(pub =>
          pub.authors?.some(a => a.toLowerCase().includes(searchAuthor.toLowerCase()))
        )
      }
      setPublications(filtered)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (publication) => {
    try {
      // Increment download count (will fail silently for anon — that's fine)
      await supabase
        .from('publications')
        .update({ download_count: (publication.download_count || 0) + 1 })
        .eq('id', publication.id)

      if (publication.file_path) {
        // Get public URL from the research-publications bucket
        const { data } = supabase.storage
          .from('research-publications')
          .getPublicUrl(publication.file_path)

        if (data?.publicUrl) {
          window.open(data.publicUrl, '_blank')
        }
      }
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  const typeLabel = (t) => {
    const map = { paper: 'Research Paper', book: 'Book', article: 'Article', thesis: 'Thesis' }
    return map[t] || t
  }

  const typeIcon = (t) => {
    const map = { paper: 'description', book: 'menu_book', article: 'article', thesis: 'school' }
    return map[t] || 'description'
  }

  return (
    <div>
      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Search / Filter bar */}
      <form onSubmit={handleSearch} className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by title…"
              value={searchTitle}
              onChange={e => setSearchTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Author</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by author…"
              value={searchAuthor}
              onChange={e => setSearchAuthor(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select
              className="form-input"
              value={publicationType}
              onChange={e => setPublicationType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="paper">Research Paper</option>
              <option value="book">Book</option>
              <option value="article">Article</option>
              <option value="thesis">Thesis</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => { setSearchTitle(''); setSearchAuthor(''); setPublicationType(''); loadPublications() }}
          >
            Clear
          </button>
        </div>
      </form>

      {/* Publications grid */}
      {loading ? (
        <div className="loading">Loading publications…</div>
      ) : publications.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">library_books</span>
          <p className="text-gray-500">No publications found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publications.map(pub => (
            <div key={pub.id} className="bg-white rounded-xl border border-outline shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1 bg-secondary" />

              {/* Icon header */}
              <div className="h-32 bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-primary opacity-30">
                  {typeIcon(pub.publication_type)}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <span className="badge-green text-xs mb-2 self-start">{typeLabel(pub.publication_type)}</span>
                <h3 className="font-serif font-semibold text-primary text-lg mb-2 line-clamp-2">{pub.title}</h3>
                {pub.abstract && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-3">{pub.abstract}</p>
                )}
                <div className="mt-auto space-y-1 text-xs text-gray-500">
                  <p><span className="font-medium text-gray-600">Authors:</span> {pub.authors?.join(', ') || 'Unknown'}</p>
                  <p><span className="font-medium text-gray-600">Submitted by:</span> {pub.profiles?.full_name || 'Unknown'}</p>
                  <p><span className="font-medium text-gray-600">Date:</span> {new Date(pub.submitted_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-outline flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">download</span>
                  {pub.download_count || 0} downloads
                </span>
                {pub.file_path && (
                  <button
                    onClick={() => handleDownload(pub)}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    Download PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
