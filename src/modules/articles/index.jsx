import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../app/RoleProvider'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

export default function ArticlesPage() {
  const { role } = useRole()
  const isAdmin = role === 'admin'

  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { loadArticles() }, [])

  const loadArticles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })

    if (!error && data) {
      setArticles(data)
      setCategories([...new Set(data.map(a => a.category).filter(Boolean))])
    }
    setLoading(false)
  }

  const filtered = articles.filter(a => {
    if (categoryFilter && a.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return a.title.toLowerCase().includes(q) ||
        a.excerpt?.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q))
    }
    return true
  })

  if (showForm && isAdmin) {
    return <ArticleForm onComplete={() => { setShowForm(false); loadArticles() }} onCancel={() => setShowForm(false)} />
  }

  if (selectedArticle) {
    return <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-secondary font-label-lg tracking-widest uppercase mb-3 block text-xs sm:text-sm">Knowledge Hub</span>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-headline-xl mb-4">Articles & Downloads</h1>
            <p className="text-sm sm:text-body-lg text-white/70">
              Explore our collection of Islamic articles, research papers, and downloadable resources.
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(true)}
              className="bg-secondary text-white px-6 py-3 rounded-xl font-label-lg flex items-center gap-2 hover:opacity-90 transition-all shrink-0">
              <Icon name="add" className="text-lg" />
              Add Article
            </button>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[57px] sm:top-[65px] z-40 bg-white/90 backdrop-blur-md border-b border-outline">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button onClick={() => setCategoryFilter('')}
              className={`px-4 py-1.5 rounded-full font-serif text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${!categoryFilter ? 'bg-primary text-white' : 'bg-white border border-outline text-slate-600 hover:border-primary hover:text-primary'}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full font-serif text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${categoryFilter === cat ? 'bg-primary text-white' : 'bg-white border border-outline text-slate-600 hover:border-primary hover:text-primary'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-auto sm:ml-auto">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input className="pl-9 pr-4 py-2 bg-white border border-outline rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-64 transition-all"
              placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading articles…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="article" className="text-5xl text-slate-200 mb-4 block mx-auto" />
            <p className="text-slate-500 text-sm">No articles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(article => (
              <ArticleCard key={article.id} article={article} onClick={() => setSelectedArticle(article)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Article Form (Admin only) ───────────────────────────────
function ArticleForm({ onComplete, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    category: '',
    tags: '',
    author_name: '',
    file_url: '',
    published: true,
  })
  const [file, setFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const title = e.target.value
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setFormData(prev => ({ ...prev, title, slug }))
  }

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.slug.trim()) return

    setLoading(true)
    setError(null)

    try {
      let fileUrl = formData.file_url
      let coverImageUrl = formData.cover_image_url

      // Upload cover image if provided
      if (coverFile) {
        const coverName = `covers/${Date.now()}_${coverFile.name}`
        const { error: coverErr } = await supabase.storage
          .from('research-publications')
          .upload(coverName, coverFile)

        if (coverErr) throw coverErr

        const { data: coverUrlData } = supabase.storage
          .from('research-publications')
          .getPublicUrl(coverName)

        coverImageUrl = coverUrlData?.publicUrl || ''
      }

      // Upload file if provided
      if (file) {
        const fileName = `${Date.now()}_${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('research-publications')
          .upload(`articles/${fileName}`, file)

        if (uploadErr) throw uploadErr

        const { data: urlData } = supabase.storage
          .from('research-publications')
          .getPublicUrl(`articles/${fileName}`)

        fileUrl = urlData?.publicUrl || ''
      }

      const { error: insertErr } = await supabase
        .from('articles')
        .insert({
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt || null,
          content: formData.content || null,
          cover_image_url: coverImageUrl || null,
          category: formData.category || null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          author_name: formData.author_name || null,
          file_url: fileUrl || null,
          published: formData.published,
          published_at: formData.published ? new Date().toISOString() : null,
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
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <button onClick={onCancel}
          className="flex items-center gap-1 text-primary font-medium text-sm mb-6 hover:underline">
          <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Articles
        </button>

        <div className="card">
          <h2 className="text-headline-md font-serif text-primary mb-1">Add New Article</h2>
          <p className="text-sm text-gray-500 mb-6">Create a new article or upload a downloadable resource</p>

          {error && <div className="alert-error mb-4">{error}</div>}
          {success && <div className="alert-success mb-4">Article published successfully!</div>}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input type="text" name="title" className="form-input" required
                  value={formData.title} onChange={handleTitleChange}
                  placeholder="Enter article title" />
              </div>

              {/* Slug */}
              <div className="form-group">
                <label className="form-label">Slug (URL-friendly)</label>
                <input type="text" name="slug" className="form-input"
                  value={formData.slug} onChange={handleChange}
                  placeholder="auto-generated-from-title" />
              </div>

              {/* Author */}
              <div className="form-group">
                <label className="form-label">Author Name</label>
                <input type="text" name="author_name" className="form-input"
                  value={formData.author_name} onChange={handleChange}
                  placeholder="Author name" />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" name="category" className="form-input"
                  value={formData.category} onChange={handleChange}
                  placeholder="e.g. Fiqh, Hadith, Tafsir, History" />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input type="text" name="tags" className="form-input"
                  value={formData.tags} onChange={handleChange}
                  placeholder="e.g. quran, sunnah, fiqh" />
              </div>

              {/* Cover Image */}
              <div className="form-group">
                <label className="form-label">Cover Image</label>
                <div className="border-2 border-dashed border-outline rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-3xl text-gray-400 mb-2 block">image</span>
                  <input type="file" onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    accept="image/*" className="hidden" id="cover-image-input" />
                  <label htmlFor="cover-image-input" className="cursor-pointer">
                    <span className="text-primary font-medium hover:underline">Click to upload cover image</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
                  {coverFile && <p className="text-sm text-primary mt-2 font-medium">✓ {coverFile.name}</p>}
                </div>
                <p className="text-xs text-gray-400 mt-2">Or paste a URL instead:</p>
                <input type="url" name="cover_image_url" className="form-input mt-1"
                  value={formData.cover_image_url} onChange={handleChange}
                  placeholder="https://example.com/image.jpg" />
              </div>

              {/* Excerpt */}
              <div className="form-group">
                <label className="form-label">Excerpt / Summary</label>
                <textarea name="excerpt" className="form-input min-h-[80px]" rows="3"
                  value={formData.excerpt} onChange={handleChange}
                  placeholder="Brief summary of the article" />
              </div>

              {/* Content — Rich Text Editor */}
              <div className="form-group">
                <label className="form-label">Full Content</label>
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                    placeholder="Write your article content here..."
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['blockquote'],
                        [{ align: [] }],
                        ['link'],
                        ['clean'],
                      ],
                    }}
                    style={{ minHeight: '300px' }}
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="form-group">
                <label className="form-label">Downloadable File (PDF)</label>
                <div className="border-2 border-dashed border-outline rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-3xl text-gray-400 mb-2 block">cloud_upload</span>
                  <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx"
                    className="hidden" id="article-file-input" />
                  <label htmlFor="article-file-input" className="cursor-pointer">
                    <span className="text-primary font-medium hover:underline">Click to upload</span>
                    <span className="text-gray-500 text-sm"> or drag and drop</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC files</p>
                  {file && <p className="text-sm text-primary mt-2 font-medium">✓ {file.name}</p>}
                </div>
              </div>

              {/* Or paste file URL directly */}
              <div className="form-group">
                <label className="form-label">Or paste file URL directly</label>
                <input type="url" name="file_url" className="form-input"
                  value={formData.file_url} onChange={handleChange}
                  placeholder="https://example.com/file.pdf" />
              </div>

              {/* Published toggle */}
              <div className="flex items-center gap-3">
                <input type="checkbox" name="published" id="published"
                  checked={formData.published} onChange={handleChange}
                  className="form-checkbox" />
                <label htmlFor="published" className="text-sm text-gray-700 font-medium">Publish immediately</label>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading || !formData.title.trim()}>
                  {loading ? 'Publishing…' : 'Publish Article'}
                </button>
                <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Article Card ────────────────────────────────────────────
function ArticleCard({ article, onClick }) {
  return (
    <article onClick={onClick}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-outline cursor-pointer">
      <div className="h-40 sm:h-48 overflow-hidden relative">
        {article.cover_image_url ? (
          <img src={article.cover_image_url} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-white/20 text-6xl">article</span>
          </div>
        )}
        {article.file_url && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">download</span>
            PDF
          </div>
        )}
        {article.category && (
          <div className="absolute bottom-3 left-3 bg-secondary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            {article.category}
          </div>
        )}
      </div>
      <div className="p-5 sm:p-6 space-y-3">
        <h3 className="font-serif text-lg text-primary group-hover:text-secondary transition-colors line-clamp-2 font-semibold">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-outline/50 text-xs text-slate-400">
          {article.author_name && <span>{article.author_name}</span>}
          {article.published_at && <span>{new Date(article.published_at).toLocaleDateString()}</span>}
        </div>
      </div>
    </article>
  )
}

// ─── Article Detail ──────────────────────────────────────────
function ArticleDetail({ article, onBack }) {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <button onClick={onBack}
          className="flex items-center gap-1 text-primary font-medium text-sm mb-6 hover:underline">
          <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Articles
        </button>

        {article.cover_image_url && (
          <img src={article.cover_image_url} alt={article.title}
            className="w-full h-48 sm:h-72 object-cover rounded-2xl mb-8" />
        )}

        <div className="space-y-4">
          {article.category && (
            <span className="inline-block bg-secondary/10 text-secondary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {article.category}
            </span>
          )}
          <h1 className="font-serif text-2xl sm:text-4xl text-primary font-bold leading-tight">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            {article.author_name && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">person</span>
                {article.author_name}
              </span>
            )}
            {article.published_at && <span>{new Date(article.published_at).toLocaleDateString()}</span>}
          </div>
        </div>

        <div className="mt-8 prose prose-slate prose-headings:font-serif prose-headings:text-primary prose-strong:text-gray-800 max-w-none article-content"
          dangerouslySetInnerHTML={{ __html: article.content || article.excerpt || '<p>No content available.</p>' }} />

        {article.file_url && (
          <div className="mt-10 p-6 bg-white rounded-xl border border-outline flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">picture_as_pdf</span>
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">Download Article</p>
                <p className="text-xs text-gray-400">PDF format</p>
              </div>
            </div>
            <a href={article.file_url} target="_blank" rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">download</span>
              Download
            </a>
          </div>
        )}

        {article.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span key={tag} className="bg-background border border-outline text-slate-600 text-xs px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
