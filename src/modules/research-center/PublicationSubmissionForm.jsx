import { useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Publication Submission Form — admin/scholar only.
 * Uploads PDF to `research-publications` bucket and creates a DB row.
 */
export function PublicationSubmissionForm({ onComplete }) {
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    authors: [],
    publication_type: 'paper',
    file: null,
  })
  const [newAuthor, setNewAuthor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setFormData(prev => ({ ...prev, file }))
  }

  const addAuthor = () => {
    if (newAuthor.trim()) {
      setFormData(prev => ({ ...prev, authors: [...prev.authors, newAuthor.trim()] }))
      setNewAuthor('')
    }
  }

  const removeAuthor = (idx) => {
    setFormData(prev => ({ ...prev, authors: prev.authors.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data: userData } = await supabase.auth.getUser()
      let filePath = null

      // Upload PDF to research-publications bucket
      if (formData.file) {
        const fileName = `${Date.now()}_${formData.file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('research-publications')
          .upload(`submissions/${fileName}`, formData.file)

        if (uploadErr) throw uploadErr
        filePath = `submissions/${fileName}`
      }

      // Insert publication record
      const { error: insertErr } = await supabase
        .from('publications')
        .insert({
          title: formData.title,
          abstract: formData.abstract || null,
          authors: formData.authors,
          publication_type: formData.publication_type,
          file_path: filePath,
          status: 'under_review',
          submitted_by: userData.user.id,
          submitted_at: new Date().toISOString(),
        })

      if (insertErr) throw insertErr

      setSuccess(true)
      setTimeout(() => onComplete(), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-headline-md font-serif text-primary mb-1">Submit Publication</h2>
        <p className="text-sm text-gray-500 mb-6">Upload a research paper, book, or article for review</p>

        {error && <div className="alert-error mb-4">{error}</div>}
        {success && (
          <div className="alert-success mb-4">
            Publication submitted successfully! It will be reviewed before publishing.
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Publication Title *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter publication title"
              />
            </div>

            {/* Abstract */}
            <div className="form-group">
              <label className="form-label">Abstract</label>
              <textarea
                name="abstract"
                className="form-input min-h-[100px]"
                value={formData.abstract}
                onChange={handleChange}
                placeholder="Enter publication abstract"
                rows="4"
              />
            </div>

            {/* Type */}
            <div className="form-group">
              <label className="form-label">Publication Type *</label>
              <select
                name="publication_type"
                className="form-input"
                value={formData.publication_type}
                onChange={handleChange}
              >
                <option value="paper">Research Paper</option>
                <option value="book">Book</option>
                <option value="article">Article</option>
                <option value="thesis">Thesis</option>
              </select>
            </div>

            {/* Authors */}
            <div className="form-group">
              <label className="form-label">Authors</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="form-input flex-1"
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  placeholder="Add author name"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAuthor() } }}
                />
                <button type="button" onClick={addAuthor} className="btn-outline whitespace-nowrap">
                  Add
                </button>
              </div>
              {formData.authors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.authors.map((author, idx) => (
                    <span key={idx} className="badge-green flex items-center gap-1 pr-1">
                      {author}
                      <button
                        type="button"
                        onClick={() => removeAuthor(idx)}
                        className="ml-1 text-primary hover:text-tertiary transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* File upload */}
            <div className="form-group">
              <label className="form-label">Publication File (PDF) *</label>
              <div className="border-2 border-dashed border-outline rounded-lg p-6 text-center hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-3xl text-gray-400 mb-2 block">cloud_upload</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                  id="pub-file-input"
                />
                <label htmlFor="pub-file-input" className="cursor-pointer">
                  <span className="text-primary font-medium hover:underline">Click to upload</span>
                  <span className="text-gray-500 text-sm"> or drag and drop</span>
                </label>
                <p className="text-xs text-gray-400 mt-1">PDF files only</p>
                {formData.file && (
                  <p className="text-sm text-primary mt-2 font-medium">
                    ✓ {formData.file.name}
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={loading || !formData.title.trim()}
              >
                {loading ? 'Submitting…' : 'Submit for Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
