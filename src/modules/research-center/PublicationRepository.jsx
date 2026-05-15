import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Library, Download, FileText, BookOpen, GraduationCap } from 'lucide-react'
import { Button, Input, Label } from '../../shared/ui'

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
      await supabase
        .from('publications')
        .update({ download_count: (publication.download_count || 0) + 1 })
        .eq('id', publication.id)

      if (publication.file_path) {
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

  const TypeIcon = ({ type }) => {
    const iconMap = {
      paper: FileText,
      book: BookOpen,
      article: FileText,
      thesis: GraduationCap,
    }
    const Icon = iconMap[type] || FileText
    return <Icon className="w-12 h-12 text-primary opacity-30" />
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8">
      {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>}

      {/* Search / Filter bar */}
      <form onSubmit={handleSearch} className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              type="text"
              placeholder="Search by title…"
              value={searchTitle}
              onChange={e => setSearchTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <Input
              type="text"
              placeholder="Search by author…"
              value={searchAuthor}
              onChange={e => setSearchAuthor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => { setSearchTitle(''); setSearchAuthor(''); setPublicationType(''); loadPublications() }}
          >
            Clear
          </Button>
        </div>
      </form>

      {/* Publications grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading publications…</div>
      ) : publications.length === 0 ? (
        <div className="text-center py-16">
          <Library className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
          <p className="text-gray-500">No publications found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publications.map(pub => (
            <div key={pub.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1 bg-secondary" />

              {/* Icon header */}
              <div className="h-32 bg-neutral-50 flex items-center justify-center">
                <TypeIcon type={pub.publication_type} />
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full mb-2 self-start">{typeLabel(pub.publication_type)}</span>
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
              <div className="px-5 py-3 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  {pub.download_count || 0} downloads
                </span>
                {pub.file_path && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownload(pub)}
                    className="text-xs flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
