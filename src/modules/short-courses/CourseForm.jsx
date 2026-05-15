import { useRef, useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useCourseFormStore } from './useCourseFormStore'
import { useRole } from '../../app/RoleProvider'
import { Button, Input, Label, Textarea } from '../../shared/ui'

// ─── Step indicator ───────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Learning' },
  { id: 3, label: 'Curriculum' },
  { id: 4, label: 'Media' },
  { id: 5, label: 'Pricing & Settings' },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
              ${current === step.id ? 'bg-primary border-primary text-white'
                : current > step.id ? 'bg-secondary border-secondary text-white'
                : 'bg-white border-gray-300 text-gray-400'}`}>
              {current > step.id ? '✓' : step.id}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap ${current === step.id ? 'text-primary font-medium' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 ${current > step.id ? 'bg-secondary' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Reusable list editor ─────────────────────────────────────
function ListEditor({ label, placeholder, items, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !items.includes(v)) { onChange([...items, v]); setInput('') }
  }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2 mb-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder} />
        <Button type="button" variant="secondary" size="sm" onClick={add} className="flex-shrink-0">Add</Button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded text-sm">
              <span className="flex-1">{item}</span>
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-xs" aria-label="Remove item">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Curriculum builder ───────────────────────────────────────
function CurriculumBuilder({ sections, onChange }) {
  const addSection = () => onChange([...sections, { id: crypto.randomUUID(), title: '', lectures: [] }])
  const removeSection = (si) => onChange(sections.filter((_, i) => i !== si))
  const updateSection = (si, title) => onChange(sections.map((s, i) => i === si ? { ...s, title } : s))
  const addLecture = (si) => {
    onChange(sections.map((s, i) => i === si
      ? { ...s, lectures: [...s.lectures, { id: crypto.randomUUID(), title: '', content_text: '', video_url: '', duration_minutes: '', is_free_preview: false }] }
      : s))
  }
  const removeLecture = (si, li) => onChange(sections.map((s, i) => i === si ? { ...s, lectures: s.lectures.filter((_, j) => j !== li) } : s))
  const updateLecture = (si, li, field, value) => onChange(sections.map((s, i) => i === si
    ? { ...s, lectures: s.lectures.map((l, j) => j === li ? { ...l, [field]: value } : l) }
    : s))

  return (
    <div className="space-y-4">
      {sections.map((section, si) => (
        <div key={section.id} className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="bg-neutral-50 px-4 py-3 flex items-center gap-3">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">Section {si + 1}</span>
            <Input className="flex-1 py-1.5 text-sm" value={section.title}
              onChange={e => updateSection(si, e.target.value)} placeholder="Section title" />
            <button type="button" onClick={() => removeSection(si)} className="text-red-400 hover:text-red-600 text-sm px-2" aria-label="Remove section">✕</button>
          </div>
          <div className="divide-y divide-gray-100">
            {section.lectures.map((lecture, li) => (
              <div key={lecture.id} className="px-4 py-3 bg-white">
                {/* Row 1: title, duration, free preview, remove */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400 w-16 flex-shrink-0">Lecture {li + 1}</span>
                  <Input className="flex-1 py-1.5 text-sm" value={lecture.title}
                    onChange={e => updateLecture(si, li, 'title', e.target.value)} placeholder="Lecture title" />
                  <Input className="w-24 py-1.5 text-sm" type="number" min="1"
                    value={lecture.duration_minutes}
                    onChange={e => updateLecture(si, li, 'duration_minutes', e.target.value)} placeholder="Min" />
                  <label className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 cursor-pointer">
                    <input type="checkbox" className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500" checked={lecture.is_free_preview}
                      onChange={e => updateLecture(si, li, 'is_free_preview', e.target.checked)} />
                    Free preview
                  </label>
                  <button type="button" onClick={() => removeLecture(si, li)} className="text-red-400 hover:text-red-600 text-sm px-1" aria-label="Remove lecture">✕</button>
                </div>
                {/* Row 2: video URL */}
                <div className="mb-2">
                  <Input
                    className="text-sm py-1.5"
                    value={lecture.video_url || ''}
                    onChange={e => updateLecture(si, li, 'video_url', e.target.value)}
                    placeholder="▶ YouTube URL for this lecture (e.g. https://youtu.be/…)"
                  />
                </div>
                {/* Row 3: notes */}
                <Textarea className="text-sm py-1.5" rows={2} value={lecture.content_text}
                  onChange={e => updateLecture(si, li, 'content_text', e.target.value)}
                  placeholder="Optional lecture notes or description…" />
              </div>
            ))}
          </div>
          <div className="px-4 py-2 bg-neutral-50 border-t border-gray-100">
            <button type="button" onClick={() => addLecture(si)}
              className="text-primary text-sm font-medium hover:text-primary-600">+ Add Lecture</button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full" onClick={addSection}>+ Add Section</Button>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────
export function CourseForm({ onComplete, editCourse = null }) {
  // All state lives in Zustand (persisted to localStorage)
  const store = useCourseFormStore()
  const { role } = useRole()
  const isAdmin = role === 'admin'
  const isEditMode = !!editCourse
  const {
    step, setStep, setField, markSaved, reset, loadCourse,
    draftId, lastSaved,
    title, subtitle, description, category, subcategory, tags, language, level,
    objectives, requirements,
    sections,
    thumbnailPreview, promoVideoUrl,
    isFree, fee,
    qaEnabled, announcementsEnabled, commentsEnabled,
  } = store

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState(null)
  const [savedMsg, setSavedMsg] = useState(null)
  const thumbnailRef = useRef()
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [editLoaded, setEditLoaded] = useState(false)

  // Load existing course data when editing
  useEffect(() => {
    if (editCourse && !editLoaded) {
      const loadEditData = async () => {
        try {
          // Load sections and lectures for this course
          const { data: sectionData } = await supabase
            .from('course_sections')
            .select('id, title, position')
            .eq('course_id', editCourse.id)
            .order('position')

          let loadedSections = []
          if (sectionData?.length) {
            const { data: lectureData } = await supabase
              .from('course_lectures')
              .select('id, section_id, title, position, content_text, video_url, duration_minutes, is_free_preview')
              .eq('course_id', editCourse.id)
              .order('position')

            loadedSections = sectionData.map(s => ({
              id: s.id,
              title: s.title,
              lectures: (lectureData || []).filter(l => l.section_id === s.id).map(l => ({
                id: l.id,
                title: l.title,
                content_text: l.content_text || '',
                video_url: l.video_url || '',
                duration_minutes: l.duration_minutes ? String(l.duration_minutes) : '',
                is_free_preview: l.is_free_preview || false,
              })),
            }))
          }

          loadCourse(editCourse, loadedSections)
          setEditLoaded(true)
        } catch (err) {
          setError('Failed to load course data: ' + err.message)
        }
      }
      loadEditData()
    }
  }, [editCourse, editLoaded])

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailFile(file)
    setField('thumbnailPreview', URL.createObjectURL(file))
  }

  const canProceed = () => {
    if (step === 1) return title.trim().length > 0 && description.trim().length > 0
    if (step === 2) return objectives.length >= 1
    return true
  }

  // ── Build the course payload ──────────────────────────────
  const buildPayload = async (userId, status) => {
    let thumbnailUrl = null
    if (thumbnailFile) {
      const ext = thumbnailFile.name.split('.').pop()
      const path = `courses/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('course-media').upload(path, thumbnailFile, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('course-media').getPublicUrl(path)
      thumbnailUrl = urlData.publicUrl
    }

    return {
      title, subtitle, description, category, subcategory,
      tags, language, level,
      learning_objectives: objectives,
      requirements,
      thumbnail_url: thumbnailUrl,
      promo_video_url: promoVideoUrl || null,
      is_free: isFree,
      fee: isFree ? 0 : parseFloat(fee) || 0,
      qa_enabled: qaEnabled,
      announcements_enabled: announcementsEnabled,
      comments_enabled: commentsEnabled,
      status,
      created_by: userId,
    }
  }

  // ── Upsert sections + lectures ────────────────────────────
  const upsertCurriculum = async (courseId) => {
    // Delete existing sections and lectures when editing
    if (isEditMode) {
      await supabase.from('course_lectures').delete().eq('course_id', courseId)
      await supabase.from('course_sections').delete().eq('course_id', courseId)
    }

    for (let si = 0; si < sections.length; si++) {
      const sec = sections[si]
      if (!sec.title.trim()) continue
      const { data: sectionRow, error: secErr } = await supabase
        .from('course_sections')
        .insert({ course_id: courseId, title: sec.title, position: si })
        .select('id').single()
      if (secErr) throw secErr
      for (let li = 0; li < sec.lectures.length; li++) {
        const lec = sec.lectures[li]
        if (!lec.title.trim()) continue
        const { error: lecErr } = await supabase.from('course_lectures').insert({
          section_id: sectionRow.id, course_id: courseId,
          title: lec.title, position: li,
          content_text: lec.content_text || null,
          video_url: lec.video_url || null,
          duration_minutes: parseInt(lec.duration_minutes) || null,
          is_free_preview: lec.is_free_preview,
        })
        if (lecErr) throw lecErr
      }
    }
  }

  // ── Save draft ────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!title.trim()) { setError('Add a course title before saving.'); return }
    setSaving(true); setError(null); setSavedMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = await buildPayload(user.id, 'draft')

      let courseId = draftId
      if (courseId) {
        // Update existing draft
        const { error: updErr } = await supabase.from('short_courses').update(payload).eq('id', courseId)
        if (updErr) throw updErr
      } else {
        // Create new draft
        const { data: course, error: insErr } = await supabase.from('short_courses').insert(payload).select('id').single()
        if (insErr) throw insErr
        courseId = course.id
      }

      markSaved(courseId)
      setSavedMsg('Draft saved ✓')
      setTimeout(() => setSavedMsg(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Publish / Submit for approval ───────────────────────────
  const handlePublish = async () => {
    setPublishing(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // Admins publish directly; scholars submit for approval
      const targetStatus = isAdmin ? 'published' : 'pending_approval'
      const payload = await buildPayload(user.id, targetStatus)

      let courseId = draftId
      if (courseId) {
        const { error: updErr } = await supabase.from('short_courses').update(payload).eq('id', courseId)
        if (updErr) throw updErr
      } else {
        const { data: course, error: insErr } = await supabase.from('short_courses').insert(payload).select('id').single()
        if (insErr) throw insErr
        courseId = course.id
      }

      await upsertCurriculum(courseId)
      reset()           // clear the store after successful publish
      onComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8 max-w-3xl">
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
          <p className="text-sm text-neutral-500 mt-1">{isEditMode ? 'Update course details, curriculum, and media.' : 'Your progress is saved automatically as you type.'}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {lastSaved && (
            <span className="text-xs text-gray-400">
              Last saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
          {savedMsg && <span className="text-xs text-secondary font-medium">{savedMsg}</span>}
          <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Draft'}
          </Button>
          {draftId && (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Clear draft
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
        <StepIndicator current={step} />

        {error && <div className="bg-error-light text-error-dark rounded-lg p-4 text-sm mb-4">{error}</div>}

        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course Title <span className="text-red-500">*</span></Label>
              <Input value={title} onChange={e => setField('title', e.target.value)}
                placeholder="e.g. Introduction to Islamic Jurisprudence" />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={subtitle} onChange={e => setField('subtitle', e.target.value)}
                placeholder="A short tagline for your course" />
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea rows={5} value={description} onChange={e => setField('description', e.target.value)}
                placeholder="Describe what this course covers, who it's for, and what makes it valuable…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={category} onChange={e => setField('category', e.target.value)}
                  placeholder="e.g. Islamic Studies" />
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Input value={subcategory} onChange={e => setField('subcategory', e.target.value)}
                  placeholder="e.g. Fiqh" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <select className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={language} onChange={e => setField('language', e.target.value)}>
                  {['English', 'Arabic', 'Urdu', 'French', 'Turkish', 'Other'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <select className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={level} onChange={e => setField('level', e.target.value)}>
                  {['Beginner', 'Intermediate', 'Advanced', 'All levels'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <ListEditor label="Topic Tags / Keywords" placeholder="Type a tag and press Enter or Add"
              items={tags} onChange={v => setField('tags', v)} />
          </div>
        )}

        {/* ── Step 2: Learning Outcomes ── */}
        {step === 2 && (
          <div className="space-y-6">
            <ListEditor
              label="Learning Objectives — What students will learn / build / achieve *"
              placeholder="e.g. Understand the four major schools of Fiqh"
              items={objectives} onChange={v => setField('objectives', v)} />
            {objectives.length < 1 && (
              <p className="text-xs text-red-500">Add at least 1 learning objective to continue.</p>
            )}
            <ListEditor
              label="Requirements & Prerequisites"
              placeholder="e.g. Basic Arabic reading ability"
              items={requirements} onChange={v => setField('requirements', v)} />
          </div>
        )}

        {/* ── Step 3: Curriculum ── */}
        {step === 3 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Build your course structure. Add sections, then add lectures inside each section.</p>
            <CurriculumBuilder sections={sections} onChange={v => setField('sections', v)} />
          </div>
        )}

        {/* ── Step 4: Media ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Course Thumbnail</Label>
              <div onClick={() => thumbnailRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="mx-auto max-h-48 rounded object-cover" />
                ) : (
                  <div className="text-gray-400">
                    <div className="text-3xl mb-2">🖼️</div>
                    <p className="text-sm">Click to upload thumbnail</p>
                    <p className="text-xs mt-1">Recommended: 1280×720px, JPG or PNG</p>
                  </div>
                )}
              </div>
              <input ref={thumbnailRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
            </div>
            <div className="space-y-2">
              <Label>Promotional Video URL</Label>
              <Input value={promoVideoUrl} onChange={e => setField('promoVideoUrl', e.target.value)}
                placeholder="https://youtube.com/… or Supabase storage URL" />
              <p className="text-xs text-gray-400 mt-1">A short preview video shown to prospective students.</p>
            </div>
          </div>
        )}

        {/* ── Step 5: Pricing & Settings ── */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-neutral-700 mb-3">Pricing & Access</h3>
              <div className="flex gap-3 mb-4">
                {[true, false].map(free => (
                  <button key={String(free)} type="button" onClick={() => setField('isFree', free)}
                    className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors
                      ${isFree === free ? 'border-primary bg-neutral-50 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {free ? '🆓 Free' : '💳 Paid'}
                  </button>
                ))}
              </div>
              {!isFree && (
                <div className="space-y-2">
                  <Label>Price (USD)</Label>
                  <Input type="number" min="0" step="0.01" value={fee}
                    onChange={e => setField('fee', e.target.value)} placeholder="e.g. 49.99" />
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-neutral-700 mb-3">Engagement Settings</h3>
              <div className="space-y-3">
                {[
                  ['qaEnabled', qaEnabled, 'Q&A enabled', 'Students can ask and answer questions'],
                  ['announcementsEnabled', announcementsEnabled, 'Student announcements', 'Send announcements to enrolled students'],
                  ['commentsEnabled', commentsEnabled, 'Comments per lecture', 'Students can comment on individual lectures'],
                ].map(([key, val, label, desc]) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-neutral-50">
                    <input type="checkbox" className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500 mt-0.5" checked={val}
                      onChange={e => setField(key, e.target.checked)} />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{label}</div>
                      <div className="text-xs text-gray-400">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 1}>
            ← Back
          </Button>

          {step < STEPS.length ? (
            <Button type="button" variant="primary" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Continue →
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={handlePublish} disabled={publishing} loading={publishing}>
              {publishing ? 'Submitting…' : isAdmin ? '🚀 Publish Course' : '📤 Submit for Approval'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
