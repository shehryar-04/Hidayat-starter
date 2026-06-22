import { useState, useEffect } from 'react'
import {
  FileText, Download, Link as LinkIcon, Upload, Trash2,
  ExternalLink, FolderOpen, Plus,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Button, Input, Textarea, Spinner, EmptyState } from '../../../shared/ui'

/**
 * CourseResources — course-level resources (files or links) that apply to the
 * whole course rather than a single lecture.
 *
 * - Teachers/admins (isTeacher) can add (file upload or external link) and delete.
 * - Students see a clean, downloadable/open-able list in the course Resources tab.
 *
 * Backed by the `course_resources` table (migration
 * 20240301000003_course_resources.sql). Gracefully shows an empty state if the
 * table has not been migrated yet.
 *
 * @param {{ courseId: string, isTeacher?: boolean, userId?: string }} props
 */
export function CourseResources({ courseId, isTeacher = false, userId }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('link')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { if (courseId) load() }, [courseId])

  const load = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('course_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    // Table may not be migrated yet — treat as empty rather than crashing.
    if (err) {
      console.warn('[CourseResources] load failed:', err.message)
      setResources([])
    } else {
      setResources(data || [])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setUrl(''); setFormType('link'); setError(null)
    setShowForm(false)
  }

  const handleAddLink = async () => {
    if (!url.trim()) { setError('URL is required'); return }
    setBusy(true); setError(null)
    try {
      const { error: err } = await supabase.from('course_resources').insert({
        course_id: courseId,
        title: title.trim() || url.trim(),
        description: description.trim() || null,
        resource_type: 'link',
        url: url.trim(),
        created_by: userId,
      })
      if (err) throw err
      resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError(null)
    try {
      const ext = file.name.split('.').pop()
      const path = `course-resources/${courseId}/${crypto.randomUUID()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('course-media')
        .upload(path, file)
      if (upErr) throw upErr

      const { data: urlData } = supabase.storage.from('course-media').getPublicUrl(path)

      const { error: insErr } = await supabase.from('course_resources').insert({
        course_id: courseId,
        title: title.trim() || file.name,
        description: description.trim() || null,
        resource_type: 'file',
        url: urlData.publicUrl,
        created_by: userId,
      })
      if (insErr) throw insErr

      resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id) => {
    const prev = resources
    setResources((r) => r.filter((x) => x.id !== id))
    const { error: err } = await supabase.from('course_resources').delete().eq('id', id)
    if (err) {
      // Roll back on failure
      setResources(prev)
    }
  }

  if (loading) {
    return <div className="py-8 flex justify-center"><Spinner /></div>
  }

  return (
    <div className="space-y-4">
      {/* Teacher: add resource */}
      {isTeacher && (
        <div>
          {showForm ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              {/* Type toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('link')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    formType === 'link' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" /> Link
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('file')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    formType === 'file' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> File
                </button>
              </div>

              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resource title (e.g. Course Syllabus)"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description (optional)"
                rows={2}
              />

              {formType === 'link' ? (
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              ) : (
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={busy}
                  className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                {formType === 'link' && (
                  <Button size="sm" variant="primary" onClick={handleAddLink} disabled={busy}>
                    {busy ? 'Adding…' : 'Add Link'}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={resetForm} disabled={busy}>
                  Cancel
                </Button>
              </div>
              {formType === 'file' && busy && (
                <p className="text-xs text-gray-400">Uploading file…</p>
              )}
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Resource
            </Button>
          )}
        </div>
      )}

      {/* Resource list */}
      {resources.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No resources yet"
          description={
            isTeacher
              ? 'Add files or links to share materials with your students.'
              : 'No course resources have been shared yet. Check back later.'
          }
        />
      ) : (
        <div className="space-y-2">
          {resources.map((res) => (
            <div
              key={res.id}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary-200 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                res.resource_type === 'file' ? 'bg-primary-50' : 'bg-blue-50'
              }`}>
                {res.resource_type === 'file'
                  ? <FileText className="w-5 h-5 text-primary-600" />
                  : <LinkIcon className="w-5 h-5 text-blue-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{res.title}</p>
                {res.description && (
                  <p className="text-xs text-gray-400 truncate">{res.description}</p>
                )}
              </div>

              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                {...(res.resource_type === 'file' ? { download: '' } : {})}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors flex-shrink-0"
              >
                {res.resource_type === 'file'
                  ? <><Download className="w-3.5 h-3.5" /> Download</>
                  : <><ExternalLink className="w-3.5 h-3.5" /> Open</>}
              </a>

              {isTeacher && (
                <button
                  onClick={() => handleDelete(res.id)}
                  className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label="Delete resource"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
