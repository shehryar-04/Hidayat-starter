import { useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Reusable tag list editor (qualifications, specializations)
 */
function TagListEditor({ label, placeholder, items, onChange }) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (v && !items.includes(v)) { onChange([...items, v]); setInput('') }
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          className="form-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
        />
        <button type="button" onClick={add} className="btn-secondary px-4 flex-shrink-0">Add</button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-neutral-100 text-primary-700 text-xs font-medium px-3 py-1 rounded-full">
              {item}
              <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="text-gray-400 hover:text-tertiary leading-none">✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * ScholarForm — Admin creates a new scholar.
 *
 * Flow:
 *  1. Admin fills in all scholar details including the scholar's email.
 *  2. On submit:
 *     a. A Supabase Auth user is invited via signUp (password set by scholar later).
 *        If the email already has an account, we look up the existing profile.
 *     b. A `profiles` row is upserted with role = 'scholar'.
 *     c. A `scholars` row is inserted linked to that profile.
 *
 * Because the Supabase Admin API (createUser) requires the service role key
 * which must never be exposed to the frontend, we use supabase.auth.signUp
 * with a random temporary password. The scholar resets it via "Forgot Password".
 */
export function ScholarForm({ onComplete }) {
  // Identity
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('scholar')   // scholar or mufti

  // Scholar-specific
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [qualifications, setQualifications] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [employmentStatus, setEmploymentStatus] = useState('active')

  // Contact
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)   // { name, email, ref }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return
    setSaving(true); setError(null)

    try {
      const { data: adminUser } = await supabase.auth.getUser()

      // ── Step 1: Create auth user via signUp ──────────────────
      // We use a random strong password; the scholar will reset it.
      const tempPassword = crypto.randomUUID() + 'Aa1!'
      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: tempPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      })

      let profileId

      if (signUpErr) {
        // If the user already exists, try to find their profile
        if (signUpErr.message?.toLowerCase().includes('already registered')) {
          const { data: existingProfile, error: lookupErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', (await supabase.auth.getUser()).data.user?.id)
            .single()

          // Fall back: search by full_name match (best effort)
          if (lookupErr || !existingProfile) {
            throw new Error(`Email already registered. Ask the user to sign in and update their role, or use a different email.`)
          }
          profileId = existingProfile.id
        } else {
          throw signUpErr
        }
      } else {
        profileId = authData.user?.id
      }

      if (!profileId) throw new Error('Could not determine profile ID.')

      // ── Step 2: Upsert the profiles row ──────────────────────
      // The trigger may have already created it; update role + name.
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: profileId,
          role,
          full_name: fullName.trim(),
          first_name: fullName.trim().split(' ')[0],
          last_name: fullName.trim().split(' ').slice(1).join(' ') || null,
        }, { onConflict: 'id' })

      if (profileErr) throw profileErr

      // ── Step 3: Insert the scholars row ──────────────────────
      const contactInfo = {}
      if (email.trim()) contactInfo.email = email.trim()
      if (phone.trim()) contactInfo.phone = phone.trim()
      if (address.trim()) contactInfo.address = address.trim()

      const { error: scholarErr } = await supabase.from('scholars').insert({
        profile_id: profileId,
        title: title.trim() || null,
        bio: bio.trim() || null,
        qualifications,
        specializations,
        contact_info: contactInfo,
        employment_status: employmentStatus,
      })

      if (scholarErr) throw scholarErr

      setCreated({ name: fullName.trim(), email: email.trim() })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Success screen ────────────────────────────────────────
  if (created) {
    return (
      <div className="page max-w-lg">
        <div className="card text-center py-10">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="font-serif text-xl text-primary mb-2">Scholar Added</h2>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">{created.name}</span> has been added as a scholar.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            A confirmation email was sent to <span className="font-mono">{created.email}</span>.
            They should use "Forgot Password" to set their password on first login.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setCreated(null); setFullName(''); setEmail(''); setTitle(''); setBio(''); setQualifications([]); setSpecializations([]); setPhone(''); setAddress('') }}
              className="btn-outline">Add Another</button>
            <button onClick={onComplete} className="btn-primary">Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Add New Scholar</h1>
        <p className="page-subtitle">Create a scholar account. They will receive an email to set their password.</p>
      </div>

      {error && <div className="alert-error mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Identity ── */}
        <div className="card">
          <h3 className="mb-4">Identity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="form-label">Full Name <span className="text-tertiary">*</span></label>
              <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Sheikh Abdullah Al-Farouqi" required />
            </div>
            <div className="form-group sm:col-span-2">
              <label className="form-label">Email Address <span className="text-tertiary">*</span></label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="scholar@institution.edu" required />
              <p className="text-xs text-gray-400 mt-1">Used for login. Scholar will receive a password-reset email.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="scholar">Scholar</option>
                <option value="mufti">Mufti</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Employment Status</label>
              <select className="form-input" value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Academic profile ── */}
        <div className="card">
          <h3 className="mb-4">Academic Profile</h3>
          <div className="form-group">
            <label className="form-label">Title / Honorific</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sheikh, Dr., Ustadh, Mufti" />
          </div>
          <div className="form-group">
            <label className="form-label">Biography</label>
            <textarea className="form-input" rows={4} value={bio} onChange={e => setBio(e.target.value)}
              placeholder="A brief biography of the scholar's background and expertise…" />
          </div>
          <TagListEditor
            label="Qualifications"
            placeholder="e.g. PhD Islamic Studies, Ijazah in Hadith — press Enter or Add"
            items={qualifications}
            onChange={setQualifications}
          />
          <TagListEditor
            label="Specializations"
            placeholder="e.g. Fiqh, Tafsir, Hadith, Aqeedah — press Enter or Add"
            items={specializations}
            onChange={setSpecializations}
          />
        </div>

        {/* ── Contact ── */}
        <div className="card">
          <h3 className="mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 000 0000" />
            </div>
            <div className="form-group sm:col-span-2">
              <label className="form-label">Address</label>
              <textarea className="form-input" rows={2} value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Office or mailing address" />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving || !fullName.trim() || !email.trim()} className="btn-primary">
            {saving ? 'Creating Scholar…' : 'Create Scholar'}
          </button>
          <button type="button" onClick={onComplete} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  )
}
