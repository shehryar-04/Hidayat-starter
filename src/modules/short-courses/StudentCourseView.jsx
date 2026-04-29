import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../app/RoleProvider'

function getYouTubeId(url) {
  if (!url) return null
  for (const p of [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?.*v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/v\/([^?&\s]+)/,
  ]) { const m = url.match(p); if (m) return m[1] }
  return null
}

function YouTubeEmbed({ url, title }) {
  const id = getYouTubeId(url)
  if (!id) return (
    <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
      <div className="text-center text-gray-400"><div className="text-4xl mb-2">▶️</div><p className="text-sm">Video unavailable</p></div>
    </div>
  )
  return (
    <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
      <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
        title={title || 'Video'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>
  )
}

function LockedVideoPlaceholder() {
  return (
    <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-gray-900/90" />
      <div className="relative z-10 text-center px-6">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-white font-semibold text-lg mb-2">Enroll to Watch</p>
        <p className="text-white/60 text-sm max-w-sm">This lecture is only available to enrolled students. Enroll in this course to access all videos and materials.</p>
      </div>
    </div>
  )
}

const LEVEL_COLORS = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
  'All levels': 'bg-blue-100 text-blue-700',
}

export function StudentCourseView({ course, onBack }) {
  const { userId } = useRole()
  const [sections, setSections] = useState([])
  const [activeLecture, setActiveLecture] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState({})

  // Enrollment state
  const [enrolled, setEnrolled] = useState(false)
  const [pendingEnrollment, setPendingEnrollment] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState(null)
  const [enrollSuccess, setEnrollSuccess] = useState(false)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)

  // Check enrollment + load curriculum
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setCheckingEnrollment(true)
      try {
        // Check if student is enrolled
        if (userId) {
          // Get the student record for this user
          const { data: studentRow } = await supabase
            .from('students')
            .select('id')
            .eq('profile_id', userId)
            .single()

          if (studentRow) {
            const { data: enrollment } = await supabase
              .from('short_course_enrollments')
              .select('id, status')
              .eq('course_id', course.id)
              .eq('student_id', studentRow.id)
              .in('status', ['pending', 'active', 'completed'])
              .limit(1)
              .single()

            if (enrollment) {
              if (enrollment.status === 'pending') {
                setPendingEnrollment(true)
              } else {
                setEnrolled(true)
              }
            }
          }
        }
      } catch {
        // No enrollment found — that's fine
      } finally {
        setCheckingEnrollment(false)
      }

      // Load curriculum
      try {
        const { data: sectionData } = await supabase
          .from('course_sections')
          .select('id, title, position')
          .eq('course_id', course.id)
          .order('position')

        if (sectionData?.length) {
          const { data: lectureData } = await supabase
            .from('course_lectures')
            .select('id, section_id, title, position, content_text, video_url, duration_minutes, is_free_preview')
            .eq('course_id', course.id)
            .order('position')

          const enriched = sectionData.map(s => ({
            ...s,
            lectures: (lectureData || []).filter(l => l.section_id === s.id),
          }))
          setSections(enriched)

          if (enriched[0]) {
            setOpenSections({ [enriched[0].id]: true })
            if (enriched[0].lectures[0]) setActiveLecture(enriched[0].lectures[0])
          }
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    init()
  }, [course.id, userId])

  // Enroll handler
  const handleEnroll = async () => {
    setEnrolling(true); setEnrollError(null)
    try {
      // Get student record
      const { data: studentRow, error: sErr } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', userId)
        .single()

      if (sErr || !studentRow) {
        throw new Error('No student record found for your account. Please contact an administrator.')
      }

      const { error: eErr } = await supabase.from('short_course_enrollments').insert({
        course_id: course.id,
        student_id: studentRow.id,
        enrolled_at: new Date().toISOString().split('T')[0],
        status: 'pending',
      })

      if (eErr) throw eErr

      setPendingEnrollment(true)
      setEnrollSuccess(true)
      setTimeout(() => setEnrollSuccess(false), 5000)
    } catch (err) {
      setEnrollError(err.message)
    } finally {
      setEnrolling(false)
    }
  }

  const toggleSection = (id) => setOpenSections(s => ({ ...s, [id]: !s[id] }))

  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0)
  const totalMinutes = sections.reduce((sum, s) =>
    sum + s.lectures.reduce((ls, l) => ls + (parseInt(l.duration_minutes) || 0), 0), 0)

  // Can the student access this lecture's video?
  const canAccessLecture = (lecture) => {
    if (enrolled) return true
    if (lecture.is_free_preview) return true
    return false
  }

  // Handle lecture click
  const handleLectureClick = (lecture) => {
    setActiveLecture(lecture)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost text-sm">← Back to Courses</button>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-600 font-medium truncate">{course.title}</span>
        {enrolled && (
          <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">✓ Enrolled</span>
        )}
        {pendingEnrollment && !enrolled && (
          <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⏳ Pending Approval</span>
        )}
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: video + details ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Enrollment banner — not enrolled and not pending */}
          {!checkingEnrollment && !enrolled && !pendingEnrollment && (
            <div className="bg-primary rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">Enroll in this Course</h3>
                <p className="text-white/70 text-sm">
                  {course.is_free
                    ? 'This course is free. Enroll to access all lectures and materials.'
                    : `Enroll for $${course.fee} to access all lectures and materials.`}
                </p>
              </div>
              <button onClick={handleEnroll} disabled={enrolling}
                className="bg-secondary text-white px-6 py-3 rounded-xl font-bold hover:bg-secondary-600 transition-colors flex-shrink-0 shadow-lg">
                {enrolling ? 'Enrolling…' : course.is_free ? 'Enroll for Free' : `Enroll — $${course.fee}`}
              </button>
            </div>
          )}

          {/* Pending approval banner */}
          {!checkingEnrollment && pendingEnrollment && !enrolled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-600 text-lg">⏳</span>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 text-lg mb-1">Enrollment Pending Approval</h3>
                <p className="text-yellow-700 text-sm">Your request has been submitted. An admin will review and approve your access shortly.</p>
              </div>
            </div>
          )}

          {enrollError && <div className="alert-error text-sm">{enrollError}</div>}
          {enrollSuccess && <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">Enrollment request submitted! An admin will approve your access shortly.</div>}

          {/* Video player */}
          {activeLecture && canAccessLecture(activeLecture) && activeLecture.video_url ? (
            <div>
              <YouTubeEmbed url={activeLecture.video_url} title={activeLecture.title} />
              <div className="mt-3">
                <h2 className="font-semibold text-gray-800 text-lg">{activeLecture.title}</h2>
                {activeLecture.duration_minutes && (
                  <p className="text-xs text-gray-400 mt-0.5">{activeLecture.duration_minutes} min</p>
                )}
                {activeLecture.content_text && (
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">{activeLecture.content_text}</p>
                )}
              </div>
            </div>
          ) : activeLecture && !canAccessLecture(activeLecture) ? (
            <LockedVideoPlaceholder />
          ) : course.promo_video_url ? (
            <div>
              <YouTubeEmbed url={course.promo_video_url} title={course.title} />
              <p className="text-xs text-gray-400 mt-2">Promotional preview — enroll to access all lectures.</p>
            </div>
          ) : (
            <div className="aspect-video bg-primary-900 rounded-xl flex items-center justify-center">
              <div className="text-center text-white/60">
                <div className="text-5xl mb-3">🎓</div>
                <p className="text-sm">Select a lecture to start watching</p>
              </div>
            </div>
          )}

          {/* Course header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {course.level && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${LEVEL_COLORS[course.level] || 'bg-gray-100 text-gray-600'}`}>
                  {course.level}
                </span>
              )}
              {course.category && <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 text-primary-700">{course.category}</span>}
              {course.language && <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{course.language}</span>}
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${course.is_free ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {course.is_free ? 'Free' : `$${course.fee}`}
              </span>
            </div>

            <h1 className="font-serif text-2xl text-primary font-bold mb-1">{course.title}</h1>
            {course.subtitle && <p className="text-gray-500 text-sm mb-4">{course.subtitle}</p>}

            <div className="flex flex-wrap gap-6 text-sm text-gray-500 py-4 border-y border-gray-100 mb-4">
              <span>📚 {sections.length} section{sections.length !== 1 ? 's' : ''}</span>
              <span>🎬 {totalLectures} lecture{totalLectures !== 1 ? 's' : ''}</span>
              {totalMinutes > 0 && <span>⏱ {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total</span>}
            </div>

            {course.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>
            )}
          </div>

          {/* Learning objectives */}
          {course.learning_objectives?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-secondary">✓</span> What You'll Learn
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {course.learning_objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-secondary mt-0.5 flex-shrink-0">✓</span><span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.requirements?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Requirements</h3>
              <ul className="space-y-2">
                {course.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-gray-400 mt-0.5">•</span><span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Right: curriculum sidebar ── */}
        <div className="lg:col-span-1">
          {/* Enroll CTA card (sticky, only when not enrolled) */}
          {!checkingEnrollment && !enrolled && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4 sticky top-6 z-10">
              <div className="text-center mb-3">
                <span className="font-serif text-2xl font-bold text-primary">
                  {course.is_free ? 'Free' : `$${course.fee}`}
                </span>
              </div>
              <button onClick={handleEnroll} disabled={enrolling}
                className="btn-primary w-full py-3 text-sm font-bold">
                {enrolling ? 'Enrolling…' : 'Enroll Now'}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-2">Full access to all lectures and materials</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 sticky top-6 overflow-hidden" style={!enrolled ? { top: '12rem' } : {}}>
            <div className="px-5 py-4 border-b border-gray-100 bg-primary">
              <h3 className="font-semibold text-white text-sm">Course Curriculum</h3>
              <p className="text-primary-200 text-xs mt-0.5">{totalLectures} lectures · {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-400 text-sm">Loading curriculum…</div>
            ) : sections.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No curriculum added yet.</div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
                {sections.map((section, si) => (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-neutral-50 transition-colors text-left"
                    >
                      <div>
                        <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">Section {si + 1}</span>
                        <p className="text-sm font-medium text-gray-700 mt-0.5">{section.title}</p>
                      </div>
                      <span className="text-gray-400 text-xs ml-2 flex-shrink-0">
                        {openSections[section.id] ? '▲' : '▼'}
                      </span>
                    </button>

                    {openSections[section.id] && (
                      <div className="divide-y divide-gray-50">
                        {section.lectures.length === 0 ? (
                          <p className="px-5 py-3 text-xs text-gray-400">No lectures in this section.</p>
                        ) : (
                          section.lectures.map((lecture, li) => {
                            const isActive = activeLecture?.id === lecture.id
                            const accessible = canAccessLecture(lecture)
                            const locked = !accessible

                            return (
                              <button
                                key={lecture.id}
                                onClick={() => handleLectureClick(lecture)}
                                className={`w-full flex items-start gap-3 px-5 py-3 text-left transition-colors ${
                                  isActive
                                    ? 'bg-neutral-100 border-l-4 border-secondary'
                                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs ${
                                  locked ? 'bg-gray-100 text-gray-400'
                                    : isActive ? 'bg-secondary text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}>
                                  {locked ? '🔒' : isActive ? '▶' : li + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium leading-snug ${
                                    locked ? 'text-gray-400' : isActive ? 'text-primary' : 'text-gray-700'
                                  }`}>
                                    {lecture.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {lecture.duration_minutes && (
                                      <span className="text-[10px] text-gray-400">{lecture.duration_minutes}m</span>
                                    )}
                                    {lecture.is_free_preview && (
                                      <span className="text-[10px] text-secondary font-medium">Free Preview</span>
                                    )}
                                    {locked && !lecture.is_free_preview && (
                                      <span className="text-[10px] text-gray-400">Enroll to access</span>
                                    )}
                                    {!locked && lecture.video_url && (
                                      <span className="text-[10px] text-gray-400">▶ Video</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
