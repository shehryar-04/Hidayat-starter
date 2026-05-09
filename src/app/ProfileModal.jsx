import { useState, useEffect, useRef } from 'react'
import { useRole } from './RoleProvider'
import { useProfile } from './useProfile'

export default function ProfileModal({ onClose }) {
  const { role } = useRole()
  const { profile, scholarData, avatarUrl, loading, uploadAvatar, saveStudentProfile, saveScholarProfile } = useProfile()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [specializations, setSpecializations] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileRef = useRef()
  const overlayRef = useRef()

  // Populate fields when data loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || profile.full_name?.split(' ')[0] || '')
      setLastName(profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '')
    }
    if (scholarData) {
      setTitle(scholarData.title || '')
      setBio(scholarData.bio || '')
      setQualifications((scholarData.qualifications || []).join(', '))
      setSpecializations((scholarData.specializations || []).join(', '))
    }
  }, [profile, scholarData])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Show local preview immediately
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    setMsg(null)
    try {
      await uploadAvatar(file)
      setMsg({ type: 'success', text: 'Profile image updated.' })
    } catch (err) {
      setMsg({ type: 'error', text: 'Image upload failed: ' + err.message })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      if (role === 'student') {
        await saveStudentProfile({ firstName, lastName })
      } else {
        await saveScholarProfile({
          firstName,
          lastName,
          title,
          bio,
          qualifications: qualifications.split(',').map(s => s.trim()).filter(Boolean),
          specializations: specializations.split(',').map(s => s.trim()).filter(Boolean),
        })
      }
      setMsg({ type: 'success', text: 'Profile saved successfully.' })
    } catch (err) {
      setMsg({ type: 'error', text: 'Save failed: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const displayAvatar = previewUrl || avatarUrl
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">My Profile</h2>
          <button onClick={onClose} className="text-primary-200 hover:text-white text-xl leading-none">✕</button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : (
          <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[80vh]">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-24 rounded-full cursor-pointer group"
              >
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-neutral"
                    onError={() => setPreviewUrl(null)}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold border-4 border-neutral">
                    {initials}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">{uploading ? 'Uploading…' : 'Change'}</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <p className="text-xs text-gray-400 mt-2">Click avatar to change photo</p>
              <span className="mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-primary-700 capitalize">{role}</span>
            </div>

            {msg && (
              <div className={`${msg.type === 'success' ? 'alert-success' : 'alert-error'} mb-4 text-sm`}>
                {msg.text}
              </div>
            )}

            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="First name" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Last name" />
              </div>
            </div>

            {/* Scholar / Mufti extra fields */}
            {(role === 'scholar' || role === 'mufti') && (
              <>
                <div className="form-group mb-4">
                  <label className="form-label">User ID <span className="text-gray-400 font-normal text-xs">(read-only)</span></label>
                  <input className="form-input bg-gray-50 text-gray-400 text-xs font-mono" value={profile?.id || ''} readOnly />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sheikh, Dr., Ustadh" />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Qualifications <span className="text-gray-400 font-normal text-xs">(comma-separated)</span></label>
                  <input className="form-input" value={qualifications} onChange={e => setQualifications(e.target.value)} placeholder="e.g. PhD Islamic Studies, Ijazah in Hadith" />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Specializations <span className="text-gray-400 font-normal text-xs">(comma-separated)</span></label>
                  <input className="form-input" value={specializations} onChange={e => setSpecializations(e.target.value)} placeholder="e.g. Fiqh, Tafsir, Hadith" />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Bio</label>
                  <textarea className="form-input" rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="A short biography…" />
                </div>
              </>
            )}

            <button type="submit" disabled={saving || uploading} className="btn-primary w-full">
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
