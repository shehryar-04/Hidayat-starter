import { useState, useEffect } from 'react'
import { FileText, Download, Link as LinkIcon, Upload, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Button, Input, Spinner } from '../../../shared/ui'

/**
 * LectureResources — Display and manage resources attached to a lecture.
 * Teachers can upload files or add links. Students can download/view.
 */
export function LectureResources({ lectureId, isTeacher = false }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('link')
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => { if (lectureId) load() }, [lectureId])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('lecture_resources')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('created_at')
    setResources(data || [])
    setLoading(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(null)
    try {
      const ext = file.name.split('.').pop()
      const path = `lecture-resources/${lectureId}/${crypto.randomUUID()}.${ext}`

      const { error: upErr } = await supabase.storage.from('course-media').upload(path, file)
      if (upErr) throw upErr

      const { data: urlData } = supabase.storage.from('course-media').getPublicUrl(path)

      await supabase.from('lecture_resources').insert({
        lecture_id: lectureId,
        title: formTitle.trim() || file.name,
        resource_type: 'file',
        url: urlData.publicUrl,
      })

      setFormTitle('')
      setShowForm(false)
      await load()
    } catch (err) { setError(err.message) }
    finally { setUploading(false) }
  }

  const handleAddLink = async () => {
    if (!formUrl.trim()) { setError('URL is required'); return }
    setUploading(true); setError(null)
    try {
      await supabase.from('lecture_resources').insert({
        lecture_id: lectureId,
        title: formTitle.trim() || formUrl,
        resource_type: 'link',
        url: formUrl.trim(),
      })
      setFormTitle(''); setFormUrl(''); setShowForm(false)
      await load()
    } catch (err) { setError(err.message) }
    finally { setUploading(false) }
  }

  const handleDelete = async (id) => {
    await supabase.from('lecture_resources').delete().eq('id', id)
    setResources(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <div className="py-2"><Spinner size="sm" /></div>
  if (resources.length === 0 && !isTeacher) return null

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resources</h4>

      {/* Resource List */}
      {resources.length > 0 && (
        <div className="space-y-2 mb-3">
          {resources.map(res => (
            <div key={res.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
              {res.resource_type === 'file'
                ? <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                : <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
              }
              <span className="text-sm text-gray-700 flex-1 truncate">{res.title}</span>
              <a href={res.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                {res.resource_type === 'file' ? <Download className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                {res.resource_type === 'file' ? 'Download' : 'Open'}
              </a>
              {isTeacher && (
                <button onClick={() => handleDelete(res.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Teacher: Add Resource */}
      {isTeacher && (
        <>
          {showForm ? (
            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <button onClick={() => setFormType('link')}
                  className={`px-3 py-1 rounded text-xs font-medium ${formType === 'link' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                  Link
                </button>
                <button onClick={() => setFormType('file')}
                  className={`px-3 py-1 rounded text-xs font-medium ${formType === 'file' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                  File
                </button>
              </div>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Resource title" className="text-sm" />
              {formType === 'link' ? (
                <>
                  <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://..." className="text-sm" />
                  <Button size="sm" onClick={handleAddLink} disabled={uploading}>Add Link</Button>
                </>
              ) : (
                <input type="file" onChange={handleFileUpload} disabled={uploading}
                  className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary-50 file:text-primary-700" />
              )}
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Add Resource
            </Button>
          )}
        </>
      )}
    </div>
  )
}
