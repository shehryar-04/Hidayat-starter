import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../app/RoleProvider'
import { Search, Plus, Download, FileText, Trash2, ArrowLeft } from 'lucide-react'
import { Button, Input, Textarea, Label, EmptyState, Spinner } from '../../shared/ui'

export default function DownloadsPage() {
  const { role } = useRole()
  const isAdmin = role === 'admin'

  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { loadDownloads() }, [])

  const loadDownloads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('downloads')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setDownloads(data)
      setCategories([...new Set(data.map(d => d.category).filter(Boolean))])
    }
    setLoading(false)
  }

  const filtered = downloads.filter(d => {
    if (categoryFilter && d.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return d.title.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
    }
    return true
  })

  const handleDownload = async (item) => {
    await supabase
      .from('downloads')
      .update({ download_count: (item.download_count || 0) + 1 })
      .eq('id', item.id)

    window.open(item.file_url, '_blank')
  }

  if (showForm && isAdmin) {
    return <DownloadForm onComplete={() => { setShowForm(false); loadDownloads() }} onCancel={() => setShowForm(false)} />
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-secondary text-xs font-bold tracking-widest uppercase mb-3 block sm:text-sm">Resource Library</span>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-4xl font-bold mb-4">Downloads</h1>
            <p className="text-sm sm:text-lg text-white/70">
              Access our collection of Islamic PDFs, study materials, and downloadable resources.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)} className="shrink-0">
              <Plus className="w-5 h-5 mr-2" />
              Add Download
            </Button>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[57px] sm:top-[65px] z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button onClick={() => setCategoryFilter('')}
              className={`px-4 py-1.5 rounded-full font-serif text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${!categoryFilter ? 'bg-primary text-white' : 'bg-white border border-neutral-200 text-slate-600 hover:border-primary hover:text-primary'}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full font-serif text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${categoryFilter === cat ? 'bg-primary text-white' : 'bg-white border border-neutral-200 text-slate-600 hover:border-primary hover:text-primary'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-auto sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input className="pl-9 pr-4 rounded-full sm:w-64"
              placeholder="Search downloads..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Download}
            title="No downloads available"
            description="No downloadable resources have been added yet."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(item => (
              <DownloadCard key={item.id} item={item} onDownload={() => handleDownload(item)} isAdmin={isAdmin} onDelete={() => handleDelete(item.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this download?')) return
    await supabase.from('downloads').delete().eq('id', id)
    loadDownloads()
  }
}

// ─── Download Card ───────────────────────────────────────────
function DownloadCard({ item, onDownload, isAdmin, onDelete }) {
  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200">
      {/* Cover / Icon */}
      <div className="h-40 sm:h-48 overflow-hidden relative bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center">
        {item.cover_image_url ? (
          <img src={item.cover_image_url} alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <FileText className="w-16 h-16 text-white/20" />
        )}
        {item.category && (
          <div className="absolute bottom-3 left-3 bg-secondary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            {item.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 space-y-3">
        <h3 className="font-serif text-lg text-primary group-hover:text-secondary transition-colors line-clamp-2 font-semibold">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200/50">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            {item.download_count || 0} downloads
          </span>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
                aria-label="Delete download"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <Button onClick={onDownload} size="sm">
              <Download className="w-3.5 h-3.5 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Download Form (Admin only) ──────────────────────────────
function DownloadForm({ onComplete, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    cover_image_url: '',
    file_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.file_url.trim()) {
      setError('Title and file URL are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: insertErr } = await supabase
        .from('downloads')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category.trim() || null,
          cover_image_url: formData.cover_image_url.trim() || null,
          file_url: formData.file_url.trim(),
          published: true,
        })

      if (insertErr) throw insertErr

      setSuccess(true)
      setTimeout(() => onComplete(), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <Button variant="ghost" onClick={onCancel} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Downloads
        </Button>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-serif text-primary font-bold mb-1">Add New Download</h2>
          <p className="text-sm text-gray-500 mb-6">Add a PDF from Google Drive for users to download</p>

          {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 rounded-lg p-4 text-sm mb-4">Download added successfully!</div>}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input type="text" name="title" required
                  value={formData.title} onChange={handleChange}
                  placeholder="e.g. Tajweed Rules — Complete Guide" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" className="min-h-[80px]" rows="3"
                  value={formData.description} onChange={handleChange}
                  placeholder="Brief description of the download" />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input type="text" name="category"
                  value={formData.category} onChange={handleChange}
                  placeholder="e.g. Quran, Fiqh, Hadith, Arabic" />
              </div>

              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input type="url" name="cover_image_url"
                  value={formData.cover_image_url} onChange={handleChange}
                  placeholder="https://drive.google.com/... or any image URL" />
                <p className="text-xs text-gray-400 mt-1">Optional thumbnail for the download card</p>
              </div>

              <div className="space-y-2">
                <Label>PDF / File URL (Google Drive) *</Label>
                <Input type="url" name="file_url" required
                  value={formData.file_url} onChange={handleChange}
                  placeholder="https://drive.google.com/file/d/.../view" />
                <p className="text-xs text-gray-400 mt-1">Paste the Google Drive sharing link for the PDF</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="primary" type="submit" className="flex-1" disabled={loading || !formData.title.trim() || !formData.file_url.trim()}>
                  {loading ? 'Adding…' : 'Add Download'}
                </Button>
                <Button variant="ghost" type="button" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
