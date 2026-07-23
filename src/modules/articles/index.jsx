import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../app/RoleProvider'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { Search, Plus, ArrowLeft, Image, CloudUpload, FileText, Download, User } from 'lucide-react'
import { Button, Input, Textarea, Label, EmptyState, Spinner, buttonVariants, CourseGridSkeleton } from '../../shared/ui'

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
    <div className="bg-neutral-50 min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-secondary text-xs font-bold tracking-widest uppercase mb-3 block sm:text-sm">Knowledge Hub</span>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-4xl font-bold mb-4">Articles & Downloads</h1>
            <p className="text-sm sm:text-lg text-white/70">
              Explore our collection of Islamic articles, research papers, and downloadable resources.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)} className="shrink-0">
              <Plus className="w-5 h-5 mr-2" />
              Add Article
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
              placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {loading ? (
          <CourseGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No articles found"
            description="Try adjusting your search or filters."
          />
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
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <Button variant="ghost" onClick={onCancel} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Articles
        </Button>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold font-serif text-primary mb-1">Add New Article</h2>
          <p className="text-sm text-gray-500 mb-6">Create a new article or upload a downloadable resource</p>

          {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 rounded-lg p-4 text-sm mb-4">Article published successfully!</div>}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input type="text" name="title" required
                  value={formData.title} onChange={handleTitleChange}
                  placeholder="Enter article title" />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label>Slug (URL-friendly)</Label>
                <Input type="text" name="slug"
                  value={formData.slug} onChange={handleChange}
                  placeholder="auto-generated-from-title" />
              </div>

              {/* Author */}
              <div className="space-y-2">
                <Label>Author Name</Label>
                <Input type="text" name="author_name"
                  value={formData.author_name} onChange={handleChange}
                  placeholder="Author name" />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Input type="text" name="category"
                  value={formData.category} onChange={handleChange}
                  placeholder="e.g. Fiqh, Hadith, Tafsir, History" />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input type="text" name="tags"
                  value={formData.tags} onChange={handleChange}
                  placeholder="e.g. quran, sunnah, fiqh" />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Image className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
                  <input type="file" onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    accept="image/*" className="hidden" id="cover-image-input" />
                  <label htmlFor="cover-image-input" className="cursor-pointer">
                    <span className="text-primary font-medium hover:underline">Click to upload cover image</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
                  {coverFile && <p className="text-sm text-primary mt-2 font-medium">✓ {coverFile.name}</p>}
                </div>
                <p className="text-xs text-gray-400 mt-2">Or paste a URL instead:</p>
                <Input type="url" name="cover_image_url" className="mt-1"
                  value={formData.cover_image_url} onChange={handleChange}
                  placeholder="https://example.com/image.jpg" />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label>Excerpt / Summary</Label>
                <Textarea name="excerpt" className="min-h-[80px]" rows="3"
                  value={formData.excerpt} onChange={handleChange}
                  placeholder="Brief summary of the article" />
              </div>

              {/* Content — Rich Text Editor */}
              <div className="space-y-2">
                <Label>Full Content</Label>
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
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
              <div className="space-y-2">
                <Label>Downloadable File (PDF)</Label>
                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <CloudUpload className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
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
              <div className="space-y-2">
                <Label>Or paste file URL directly</Label>
                <Input type="url" name="file_url"
                  value={formData.file_url} onChange={handleChange}
                  placeholder="https://example.com/file.pdf" />
              </div>

              {/* Published toggle */}
              <div className="flex items-center gap-3">
                <input type="checkbox" name="published" id="published"
                  checked={formData.published} onChange={handleChange}
                  className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary" />
                <label htmlFor="published" className="text-sm text-gray-700 font-medium">Publish immediately</label>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button variant="primary" type="submit" className="flex-1" disabled={loading || !formData.title.trim()}>
                  {loading ? 'Publishing…' : 'Publish Article'}
                </Button>
                <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
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
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200 cursor-pointer">
      <div className="h-40 sm:h-48 overflow-hidden relative">
        {article.cover_image_url ? (
          <img src={article.cover_image_url} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center">
            <FileText className="w-14 h-14 text-white/20" />
          </div>
        )}
        {article.file_url && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
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
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200/50 text-xs text-slate-400">
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
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Articles
        </Button>

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
                <User className="w-4 h-4" />
                {article.author_name}
              </span>
            )}
            {article.published_at && <span>{new Date(article.published_at).toLocaleDateString()}</span>}
          </div>
        </div>

        <div className="mt-8 prose prose-slate prose-headings:font-serif prose-headings:text-primary prose-strong:text-gray-800 max-w-none article-content"
          dangerouslySetInnerHTML={{ __html: article.content || article.excerpt || '<p>No content available.</p>' }} />

        {article.file_url && (
          <div className="mt-10 p-6 bg-white rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">Download Article</p>
                <p className="text-xs text-gray-400">PDF format</p>
              </div>
            </div>
            <a href={article.file_url} target="_blank" rel="noopener noreferrer"
              className={buttonVariants({ variant: 'primary', size: 'md' })}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </div>
        )}

        {article.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span key={tag} className="bg-neutral-50 border border-neutral-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
