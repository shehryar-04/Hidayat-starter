import { useState, useEffect, useRef } from 'react'
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

// ─── Protected Video Player ──────────────────────────────────
// Overlays the YouTube iframe to prevent access to "Watch on YouTube" button
// and other YouTube UI elements. Only enrolled users get the actual embed.
function ProtectedVideoPlayer({ url, title, isEnrolled }) {
  const [playing, setPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimer = useRef(null)
  const id = getYouTubeId(url)

  // If not enrolled, don't render the iframe at all — show locked state
  if (!isEnrolled || !id) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-gray-900/90" />
        <div className="relative z-10 text-center px-6">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-white font-semibold text-lg mb-2">Enroll to Watch</p>
          <p className="text-white/60 text-sm max-w-sm">This lecture is only available to enrolled students.</p>
        </div>
      </div>
    )
  }

  // Embed URL with controls disabled and YouTube branding minimized
  const embedUrl = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=0&fs=1&playsinline=1&enablejsapi=1${playing ? '&autoplay=1' : ''}`

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
  }

  return (
    <div
      className="aspect-video rounded-xl overflow-hidden shadow-lg relative group select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      {/* YouTube iframe — sits behind the overlay */}
      {playing ? (
        <iframe
          className="w-full h-full absolute inset-0 z-0"
          src={embedUrl}
          title={title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        /* Thumbnail before play */
        <div className="w-full h-full absolute inset-0 z-0 bg-black">
          <img
            src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover opacity-80"
            onError={(e) => { e.target.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg` }}
          />
        </div>
      )}

      {/* Protective overlay — blocks YouTube's "Watch on YouTube" button and logo */}
      {/* Covers the top-right area where YouTube places its branding/link */}
      <div className="absolute top-0 right-0 w-[180px] h-[50px] z-20 bg-transparent" />
      {/* Covers the bottom-right where "Watch on YouTube" appears */}
      <div className="absolute bottom-0 right-0 w-[160px] h-[40px] z-20 bg-transparent" />
      {/* Top-left YouTube logo area */}
      <div className="absolute top-0 left-0 w-[120px] h-[40px] z-20 bg-transparent" />

      {/* Custom play button overlay (before playing) */}
      {!playing && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/30 transition-colors"
          onClick={() => setPlaying(true)}
        >
          <div className="w-20 h-20 rounded-full bg-white/90 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              ▶ Click to Play
            </span>
          </div>
        </div>
      )}

      {/* Watermark / branding overlay to discourage screen recording */}
      {playing && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none opacity-40">
          <span className="text-white text-[10px] font-bold tracking-wider bg-black/30 px-2 py-0.5 rounded">
            HIDAYAT
          </span>
        </div>
      )}
    </div>
  )
}

// Legacy embed for promo videos (no protection needed)
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

const LEVEL_COLORS = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
  'All levels': 'bg-blue-100 text-blue-700',
}

// ─── Payment Paywall Modal ───────────────────────────────────
function PaymentPaywall({ course, onSubmit, submitting, error, onClose }) {
  const [transactionId, setTransactionId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('easypaisa')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!transactionId.trim()) return
    onSubmit({ transactionId: transactionId.trim(), paymentMethod })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold">Payment Required</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
          </div>
          <p className="text-white/70 text-sm mt-1">Complete payment to enroll in this course</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Course & Amount */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Course</p>
            <p className="font-semibold text-gray-800">{course.title}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">Rs. {course.fee}</span>
              <span className="text-xs text-gray-400">one-time payment</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <h3 className="font-semibold text-green-800 text-sm mb-3 flex items-center gap-2">
              <span>📱</span> Send Payment To
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-100">
                <div>
                  <p className="text-xs text-gray-500">NayaPay / EasyPaisa</p>
                  <p className="font-mono font-bold text-gray-800 text-lg">0334 3121986</p>
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText('03343121986')}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-green-700">
                Send exactly <strong>Rs. {course.fee}</strong> to the above number via NayaPay or EasyPaisa, then enter your transaction ID below.
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setPaymentMethod('easypaisa')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                    paymentMethod === 'easypaisa'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  EasyPaisa
                </button>
                <button type="button"
                  onClick={() => setPaymentMethod('nayapay')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                    paymentMethod === 'nayapay'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  NayaPay
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="txnId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Transaction ID / Reference Number
              </label>
              <input
                id="txnId"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 1234567890"
                required
                className="form-input w-full"
              />
              <p className="text-xs text-gray-400 mt-1">You'll find this in your payment confirmation SMS or app notification.</p>
            </div>

            {error && <div className="alert-error text-sm">{error}</div>}

            <button
              type="submit"
              disabled={submitting || !transactionId.trim()}
              className="btn-primary w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting Payment…' : 'Submit Payment Proof'}
            </button>

            <p className="text-[10px] text-gray-400 text-center">
              Your enrollment will be activated once an admin verifies your payment.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Invoice Display ─────────────────────────────────────────
function InvoiceCard({ invoice }) {
  const invoiceRef = useRef(null)

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    verified: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  }

  const statusLabels = {
    pending: '⏳ Pending Verification',
    verified: '✓ Payment Verified',
    rejected: '✗ Payment Rejected',
  }

  return (
    <div ref={invoiceRef} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Invoice Header */}
      <div className="bg-primary p-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm">Payment Invoice</h3>
          <p className="text-white/60 text-xs mt-0.5">{invoice.invoice_number}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColors[invoice.status]}`}>
          {statusLabels[invoice.status]}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs">Amount</p>
            <p className="font-bold text-gray-800">Rs. {invoice.amount}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Payment Method</p>
            <p className="font-medium text-gray-800 capitalize">{invoice.payment_method}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Transaction ID</p>
            <p className="font-mono text-gray-800 text-xs">{invoice.transaction_id}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Submitted</p>
            <p className="text-gray-800 text-xs">{new Date(invoice.submitted_at).toLocaleDateString()}</p>
          </div>
        </div>

        {invoice.status === 'rejected' && invoice.rejection_reason && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-xs text-red-700"><strong>Reason:</strong> {invoice.rejection_reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}


// ─── Main Component ──────────────────────────────────────────
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

  // Payment state
  const [showPaywall, setShowPaywall] = useState(false)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [studentId, setStudentId] = useState(null)

  // Check enrollment + load curriculum
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setCheckingEnrollment(true)
      try {
        if (userId) {
          const { data: studentRow } = await supabase
            .from('students')
            .select('id')
            .eq('profile_id', userId)
            .single()

          if (studentRow) {
            setStudentId(studentRow.id)

            const { data: enrollment } = await supabase
              .from('short_course_enrollments')
              .select('id, status')
              .eq('course_id', course.id)
              .eq('student_id', studentRow.id)
              .in('status', ['pending', 'active', 'completed'])
              .limit(1)
              .maybeSingle()

            if (enrollment) {
              if (enrollment.status === 'pending') {
                setPendingEnrollment(true)
                // Check if there's an existing invoice
                const { data: existingInvoice } = await supabase
                  .from('payment_invoices')
                  .select('*')
                  .eq('enrollment_id', enrollment.id)
                  .order('submitted_at', { ascending: false })
                  .limit(1)
                  .maybeSingle()
                if (existingInvoice) setInvoice(existingInvoice)
              } else {
                setEnrolled(true)
              }
            }
          }
        }
      } catch {
        // No enrollment found
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

  // Enroll handler — for FREE courses, enroll directly. For PAID, show paywall.
  const handleEnroll = () => {
    if (enrolling || pendingEnrollment || enrolled) return
    if (!course.is_free && course.fee) {
      setShowPaywall(true)
    } else {
      enrollFree()
    }
  }

  // Free course enrollment
  const enrollFree = async () => {
    setEnrolling(true); setEnrollError(null)
    try {
      const { data: studentRow, error: sErr } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', userId)
        .single()

      if (sErr || !studentRow) {
        throw new Error('No student record found for your account. Please contact an administrator.')
      }

      const { data: existing } = await supabase
        .from('short_course_enrollments')
        .select('id, status')
        .eq('course_id', course.id)
        .eq('student_id', studentRow.id)
        .limit(1)
        .maybeSingle()

      if (existing) {
        if (existing.status === 'pending') setPendingEnrollment(true)
        else setEnrolled(true)
        return
      }

      const { error: eErr } = await supabase.from('short_course_enrollments').insert({
        course_id: course.id,
        student_id: studentRow.id,
        enrolled_at: new Date().toISOString().split('T')[0],
        status: 'pending',
      })

      if (eErr) {
        if (eErr.code === '23505' || eErr.message?.includes('duplicate')) {
          setPendingEnrollment(true)
          return
        }
        throw eErr
      }

      setPendingEnrollment(true)
      setEnrollSuccess(true)
      setTimeout(() => setEnrollSuccess(false), 5000)
    } catch (err) {
      setEnrollError(err.message)
    } finally {
      setEnrolling(false)
    }
  }

  // Paid course — submit payment proof
  const handlePaymentSubmit = async ({ transactionId, paymentMethod }) => {
    setPaymentSubmitting(true); setPaymentError(null)
    try {
      const sid = studentId || (await supabase.from('students').select('id').eq('profile_id', userId).single()).data?.id
      if (!sid) throw new Error('No student record found.')

      // Check for existing enrollment
      let enrollmentId
      const { data: existing } = await supabase
        .from('short_course_enrollments')
        .select('id, status')
        .eq('course_id', course.id)
        .eq('student_id', sid)
        .limit(1)
        .maybeSingle()

      if (existing) {
        enrollmentId = existing.id
        if (existing.status === 'active' || existing.status === 'completed') {
          setEnrolled(true)
          setShowPaywall(false)
          return
        }
      } else {
        // Create enrollment with pending status
        const { data: newEnrollment, error: eErr } = await supabase
          .from('short_course_enrollments')
          .insert({
            course_id: course.id,
            student_id: sid,
            enrolled_at: new Date().toISOString().split('T')[0],
            status: 'pending',
            payment_ref: transactionId,
          })
          .select('id')
          .single()

        if (eErr) {
          if (eErr.code === '23505' || eErr.message?.includes('duplicate')) {
            const { data: refetch } = await supabase
              .from('short_course_enrollments')
              .select('id')
              .eq('course_id', course.id)
              .eq('student_id', sid)
              .single()
            enrollmentId = refetch?.id
          } else {
            throw eErr
          }
        } else {
          enrollmentId = newEnrollment.id
        }
      }

      if (!enrollmentId) throw new Error('Failed to create enrollment.')

      // Generate invoice number
      const invoiceNumber = 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000)

      // Create payment invoice
      const { data: newInvoice, error: invErr } = await supabase
        .from('payment_invoices')
        .insert({
          enrollment_id: enrollmentId,
          student_id: sid,
          course_id: course.id,
          amount: course.fee,
          transaction_id: transactionId,
          payment_method: paymentMethod,
          status: 'pending',
          invoice_number: invoiceNumber,
        })
        .select('*')
        .single()

      if (invErr) throw invErr

      // Create admin notification
      await supabase.from('admin_notifications').insert({
        type: 'payment_submitted',
        title: 'New Payment Submission',
        message: `A student has submitted payment of Rs. ${course.fee} for "${course.title}" (TXN: ${transactionId})`,
        metadata: {
          invoice_id: newInvoice.id,
          invoice_number: invoiceNumber,
          course_id: course.id,
          course_title: course.title,
          student_id: sid,
          amount: course.fee,
          transaction_id: transactionId,
          payment_method: paymentMethod,
        },
      })

      setInvoice(newInvoice)
      setPendingEnrollment(true)
      setShowPaywall(false)
      setEnrollSuccess(true)
      setTimeout(() => setEnrollSuccess(false), 5000)
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaymentSubmitting(false)
    }
  }

  const toggleSection = (id) => setOpenSections(s => ({ ...s, [id]: !s[id] }))

  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0)
  const totalMinutes = sections.reduce((sum, s) =>
    sum + s.lectures.reduce((ls, l) => ls + (parseInt(l.duration_minutes) || 0), 0), 0)

  const canAccessLecture = (lecture) => {
    if (enrolled) return true
    if (lecture.is_free_preview) return true
    return false
  }

  const handleLectureClick = (lecture) => {
    setActiveLecture(lecture)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Paywall Modal */}
      {showPaywall && (
        <PaymentPaywall
          course={course}
          onSubmit={handlePaymentSubmit}
          submitting={paymentSubmitting}
          error={paymentError}
          onClose={() => { setShowPaywall(false); setPaymentError(null) }}
        />
      )}

      {/* Back bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 overflow-x-auto">
        <button onClick={onBack} className="btn-ghost text-sm">← Back to Courses</button>
        <span className="text-gray-300">|</span>
        <span className="text-xs sm:text-sm text-gray-600 font-medium truncate max-w-[150px] sm:max-w-none">{course.title}</span>
        {enrolled && (
          <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">✓ Enrolled</span>
        )}
        {pendingEnrollment && !enrolled && (
          <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⏳ Pending Approval</span>
        )}
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">

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
                    : `Pay Rs. ${course.fee} to enroll and access all lectures and materials.`}
                </p>
              </div>
              <button onClick={handleEnroll} disabled={enrolling || pendingEnrollment}
                className="bg-secondary text-white px-6 py-3 rounded-xl font-bold hover:bg-secondary-600 transition-colors flex-shrink-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {enrolling ? 'Enrolling…' : course.is_free ? 'Enroll for Free' : `Enroll — Rs. ${course.fee}`}
              </button>
            </div>
          )}

          {/* Pending approval banner with invoice */}
          {!checkingEnrollment && pendingEnrollment && !enrolled && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 text-lg">⏳</span>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800 text-lg mb-1">Enrollment Pending Approval</h3>
                  <p className="text-yellow-700 text-sm">
                    {invoice
                      ? 'Your payment has been submitted. An admin will verify it and activate your access.'
                      : 'Your request has been submitted. An admin will review and approve your access shortly.'}
                  </p>
                </div>
              </div>
              {invoice && <InvoiceCard invoice={invoice} />}
            </div>
          )}

          {enrollError && <div className="alert-error text-sm">{enrollError}</div>}
          {enrollSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
              {invoice
                ? 'Payment submitted successfully! Your invoice has been generated. An admin will verify your payment shortly.'
                : 'Enrollment request submitted! An admin will approve your access shortly.'}
            </div>
          )}

          {/* Video player */}
          {activeLecture && canAccessLecture(activeLecture) && activeLecture.video_url ? (
            <div>
              <ProtectedVideoPlayer
                url={activeLecture.video_url}
                title={activeLecture.title}
                isEnrolled={enrolled || activeLecture.is_free_preview}
              />
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
            <ProtectedVideoPlayer url={null} title={null} isEnrolled={false} />
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
                {course.is_free ? 'Free' : `Rs. ${course.fee}`}
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
          {/* Enroll CTA card */}
          {!checkingEnrollment && !enrolled && !pendingEnrollment && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-4 lg:sticky lg:top-6 z-10">
              <div className="text-center mb-3">
                <span className="font-serif text-2xl font-bold text-primary">
                  {course.is_free ? 'Free' : `Rs. ${course.fee}`}
                </span>
              </div>
              <button onClick={handleEnroll} disabled={enrolling || pendingEnrollment}
                className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                {enrolling ? 'Enrolling…' : 'Enroll Now'}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-2">Full access to all lectures and materials</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 lg:sticky lg:top-6 overflow-hidden">
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
