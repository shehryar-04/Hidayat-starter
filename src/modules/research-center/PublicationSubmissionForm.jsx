import { useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Publication Submission Form Component
 * Allows scholars to submit academic publications with file attachments
 * Requirements: 9.1, 9.5
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setFormData((prev) => ({
      ...prev,
      file,
    }))
  }

  const addAuthor = () => {
    if (newAuthor.trim()) {
      setFormData((prev) => ({
        ...prev,
        authors: [...prev.authors, newAuthor.trim()],
      }))
      setNewAuthor('')
    }
  }

  const removeAuthor = (index) => {
    setFormData((prev) => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      let filePath = null

      // Upload file if provided
      if (formData.file) {
        const fileName = `${Date.now()}_${formData.file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('publications')
          .upload(`submissions/${fileName}`, formData.file)

        if (uploadErr) throw uploadErr
        filePath = `submissions/${fileName}`
      }

      // Insert publication record
      const { error: err } = await supabase
        .from('publications')
        .insert({
          title: formData.title,
          abstract: formData.abstract || null,
          authors: formData.authors,
          publication_type: formData.publication_type,
          file_path: filePath,
          status: 'under_review',
          submitted_by: user.user.id,
          submitted_at: new Date().toISOString(),
        })

      if (err) throw err

      setSuccess(true)
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (err) {
      setError(err.message)
      console.error('Error submitting publication:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="publication-submission-form">
      <h2>Submit Academic Publication</h2>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          Publication submitted successfully! It will be reviewed by the admin.
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="title">Publication Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter publication title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="abstract">Abstract</label>
            <textarea
              id="abstract"
              name="abstract"
              value={formData.abstract}
              onChange={handleInputChange}
              placeholder="Enter publication abstract"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="publication_type">Publication Type *</label>
            <select
              id="publication_type"
              name="publication_type"
              value={formData.publication_type}
              onChange={handleInputChange}
            >
              <option value="paper">Research Paper</option>
              <option value="book">Book</option>
              <option value="article">Article</option>
            </select>
          </div>

          <div className="form-section">
            <h3>Authors</h3>
            <div className="list-input">
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Add author name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAuthor()
                  }
                }}
              />
              <button type="button" onClick={addAuthor}>
                Add
              </button>
            </div>

            {formData.authors.length > 0 && (
              <div className="list-items">
                {formData.authors.map((author, idx) => (
                  <div key={idx} className="list-item">
                    <span>{author}</span>
                    <button
                      type="button"
                      onClick={() => removeAuthor(idx)}
                      className="remove-button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="file">Publication File (PDF, DOC, etc.)</label>
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />
            {formData.file && (
              <p className="file-info">Selected: {formData.file.name}</p>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? 'Submitting...' : 'Submit Publication'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
