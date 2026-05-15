import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CloudUpload } from 'lucide-react'
import { Button, Input, Textarea, Label } from '../../shared/ui'

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
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold font-serif text-primary mb-1">Submit Publication</h2>
        <p className="text-sm text-gray-500 mb-6">Upload a research paper, book, or article for review</p>

        {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>}
        {success && (
          <div className="bg-green-50 text-green-700 rounded-lg p-4 text-sm mb-4">
            Publication submitted successfully! It will be reviewed before publishing.
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label>Publication Title *</Label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter publication title"
              />
            </div>

            {/* Abstract */}
            <div className="space-y-2">
              <Label>Abstract</Label>
              <Textarea
                name="abstract"
                className="min-h-[100px]"
                value={formData.abstract}
                onChange={handleChange}
                placeholder="Enter publication abstract"
                rows="4"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Publication Type *</Label>
              <select
                name="publication_type"
                className="flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
            <div className="space-y-2">
              <Label>Authors</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  className="flex-1"
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  placeholder="Add author name"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAuthor() } }}
                />
                <Button variant="outline" type="button" onClick={addAuthor} className="whitespace-nowrap">
                  Add
                </Button>
              </div>
              {formData.authors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.authors.map((author, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full pr-1">
                      {author}
                      <button
                        type="button"
                        onClick={() => removeAuthor(idx)}
                        className="ml-1 text-green-600 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <Label>Publication File (PDF) *</Label>
              <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <CloudUpload className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
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
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                disabled={loading || !formData.title.trim()}
              >
                {loading ? 'Submitting…' : 'Submit for Review'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
