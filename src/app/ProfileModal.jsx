import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Camera } from 'lucide-react'
import { useRole } from './RoleProvider'
import { useProfile } from './useProfile'
import { Modal, Button, Input, Textarea, FormField, Badge } from '../shared/ui'
import { useIntl } from '../lib/intl'

export default function ProfileModal({ onClose }) {
  const navigate = useNavigate()
  const { role } = useRole()
  const { profile, scholarData, avatarUrl, loading, uploadAvatar, saveStudentProfile, saveScholarProfile } = useProfile()
  const { intl } = useIntl()

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
  const fileRef = useRef(null)

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
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    setMsg(null)
    try {
      await uploadAvatar(file)
      setMsg({ type: 'success', text: 'Profile image updated successfully.' })
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
          qualifications: qualifications.split(',').map((s) => s.trim()).filter(Boolean),
          specializations: specializations.split(',').map((s) => s.trim()).filter(Boolean),
        })
      }
      setMsg({ type: 'success', text: intl('common.savedSuccessfully', null, 'Profile saved successfully.') })
    } catch (err) {
      setMsg({ type: 'error', text: 'Save failed: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const displayAvatar = previewUrl || avatarUrl
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="md"
      title={intl('nav.myProfile', null, 'My Profile')}
      description="Manage your account profile and credentials"
      loading={loading}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Avatar section */}
        <div className="flex flex-col items-center justify-center pb-2">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full cursor-pointer group shadow-sm border-2 border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setPreviewUrl(null)}
              />
            ) : (
              <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white mb-0.5" />
              <span className="text-white text-[11px] font-medium">
                {uploading ? intl('common.loading') : 'Change'}
              </span>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="text-xs text-neutral-400 mt-2">Click avatar to change photo</p>
          <div className="mt-1">
            <Badge variant="primary" size="sm" className="capitalize">
              {role}
            </Badge>
          </div>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="First Name" required>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="First name"
            />
          </FormField>
          <FormField label="Last Name" required>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Last name"
            />
          </FormField>
        </div>

        {/* Scholar / Mufti Fields */}
        {(role === 'scholar' || role === 'mufti') && (
          <>
            <FormField label="User ID" helperText="System unique identifier (read-only)">
              <Input
                value={profile?.id || ''}
                readOnly
                className="bg-neutral-50 dark:bg-neutral-800 font-mono text-xs text-neutral-500"
              />
            </FormField>

            <FormField label={intl('scholars.titleField', null, 'Title / Designation')}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sheikh, Dr., Mufti, Ustadh"
              />
            </FormField>

            <FormField
              label={intl('scholars.qualifications', null, 'Qualifications')}
              helperText="Comma-separated qualifications"
            >
              <Input
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. PhD Islamic Studies, Ijazah in Hadith"
              />
            </FormField>

            <FormField
              label={intl('scholars.specializations', null, 'Specializations')}
              helperText="Comma-separated areas of expertise"
            >
              <Input
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
                placeholder="e.g. Fiqh, Tafsir, Hadith"
              />
            </FormField>

            <FormField label={intl('scholars.bio', null, 'Biography')}>
              <Textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short biography…"
              />
            </FormField>
          </>
        )}

        <div className="pt-2 flex flex-col gap-2.5">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving || uploading}
            className="w-full font-semibold"
          >
            {intl('common.save', null, 'Save Profile')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onClose()
              navigate('/reset-password')
            }}
            className="w-full inline-flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-300"
          >
            <KeyRound className="w-4 h-4 text-neutral-500" />
            <span>{intl('auth.changePassword', null, 'Change Password')}</span>
          </Button>
        </div>
      </form>
    </Modal>
  )
}
