import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { DynamicForm } from '../../shared/DynamicForm'
import { Button, Badge, Spinner } from '../../shared/ui'

export function StudentProfile({ student, onBack, onStatusChange }) {
  const [formSchema, setFormSchema] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusHistory, setStatusHistory] = useState([])
  const [documents, setDocuments] = useState([])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: schema }, { data: profile }, { data: history }] = await Promise.all([
          supabase.from('form_schemas').select('*').eq('form_key', 'student_profile').single(),
          supabase.from('students').select('*, profiles(full_name)').eq('id', student.id).single(),
          supabase.from('student_status_history').select('*, profiles(full_name)').eq('student_id', student.id).order('changed_at', { ascending: false }),
        ])
        if (schema) setFormSchema(schema)
        if (profile) setProfileData({ ...profile, full_name: profile.profiles?.full_name || '' })
        if (history) setStatusHistory(history)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [student?.id])

  const handleStatusChange = async (newStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('students').update({ status: newStatus }).eq('id', student.id)
      await supabase.from('student_status_history').insert({ student_id: student.id, old_status: profileData?.status, new_status: newStatus, changed_by: user.id })
      setProfileData(p => ({ ...p, status: newStatus }))
      const { data: history } = await supabase.from('student_status_history').select('*, profiles(full_name)').eq('student_id', student.id).order('changed_at', { ascending: false })
      if (history) setStatusHistory(history)
      onStatusChange?.(newStatus)
      setMsg({ type: 'success', text: 'Status updated.' })
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
  }

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingDoc(true)
    try {
      const fileName = `${student.id}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('student-documents').upload(fileName, file)
      if (error) throw error
      setDocuments(d => [...d, { name: file.name, path: fileName }])
      setMsg({ type: 'success', text: 'Document uploaded.' })
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setUploadingDoc(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
  if (!profileData) return <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8"><div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">Student profile not found.</div></div>

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 text-sm">← Back to Search</Button>

      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-title mb-1">{profileData.full_name}</h1>
          <p className="text-sm text-gray-500">Enrollment #: <span className="font-medium text-gray-700">{profileData.enrollment_number}</span></p>
        </div>
        {profileData.status === 'active' ? <Badge variant="success">{profileData.status}</Badge> :
         profileData.status === 'suspended' ? <Badge variant="error">{profileData.status}</Badge> :
         <Badge variant="default">{profileData.status}</Badge>}
      </div>

      {msg && <div className={msg.type === 'success' ? 'bg-green-50 text-green-700 rounded-lg p-4 text-sm mb-4' : 'bg-red-50 text-red-700 rounded-lg p-4 text-sm mb-4'}>{msg.text}</div>}

      {/* Status change */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="mb-3">Change Status</h3>
        <div className="flex flex-wrap gap-2">
          {['active', 'suspended', 'graduated', 'withdrawn'].map(s => (
            <Button key={s} onClick={() => handleStatusChange(s)} disabled={profileData.status === s}
              variant={profileData.status === s ? 'outline' : 'outline'}
              className={profileData.status === s ? 'bg-gray-100 text-gray-400 cursor-not-allowed capitalize' : 'capitalize'}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Status history */}
      {statusHistory.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 mb-6">
          <h3 className="mb-3">Status History</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Date</th><th>From</th><th>To</th><th>Changed By</th></tr></thead>
              <tbody>
                {statusHistory.map((e, i) => (
                  <tr key={i}>
                    <td className="text-gray-500 text-xs">{new Date(e.changed_at).toLocaleString()}</td>
                    <td>{e.old_status || '—'}</td>
                    <td>
                      {e.new_status === 'active' ? <Badge variant="success">{e.new_status}</Badge> :
                       e.new_status === 'suspended' ? <Badge variant="error">{e.new_status}</Badge> :
                       <Badge variant="default">{e.new_status}</Badge>}
                    </td>
                    <td className="text-gray-500">{e.profiles?.full_name || 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile form */}
      {formSchema && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 mb-6">
          <h3 className="mb-4">Edit Profile</h3>
          <DynamicForm schema={formSchema} initialValues={profileData} onSubmit={async ({ data }) => {
            await supabase.from('students').update(data).eq('id', student.id)
            setMsg({ type: 'success', text: 'Profile saved.' })
          }} />
        </div>
      )}

      {/* Documents */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
        <h3 className="mb-4">Documents</h3>
        <label className="cursor-pointer inline-flex items-center gap-2 text-sm">
          <Button variant="outline" size="sm" asChild>
            <span>{uploadingDoc ? 'Uploading…' : '📎 Upload Document'}</span>
          </Button>
          <input type="file" className="hidden" onChange={handleDocumentUpload} disabled={uploadingDoc} />
        </label>
        {documents.length > 0 && (
          <ul className="mt-4 space-y-2">
            {documents.map((doc, i) => (
              <li key={i} className="flex items-center justify-between text-sm bg-neutral-50 px-3 py-2 rounded">
                <span>{doc.name}</span>
                <Button variant="ghost" size="sm" className="text-xs" onClick={async () => {
                  const { data } = await supabase.storage.from('student-documents').download(doc.path)
                  if (data) { const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = doc.name; a.click(); URL.revokeObjectURL(url) }
                }}>Download</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
