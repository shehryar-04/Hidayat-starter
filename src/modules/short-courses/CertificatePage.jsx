import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react'
import { getCertificateById } from './services/certificateService'
import { downloadCertificatePdf } from './services/certificatePdf'
import CertificateTemplate from './components/CertificateTemplate'
import { Spinner } from '../../shared/ui'

/**
 * CertificatePage — full-screen view of a single certificate with
 * one-click PDF download.
 *
 * Route: /certificate/:id   (protected — only the owner/admin reaches it
 * via the dashboard or course view links).
 */
export default function CertificatePage() {
  const { id } = useParams()
  const certRef = useRef(null)
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [scale, setScale] = useState(1)

  const wrapperRef = useRef(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const data = await getCertificateById(id)
      if (active) {
        setCert(data)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  // Scale the fixed 1123px certificate to fit the viewport width.
  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return
      const available = wrapperRef.current.clientWidth
      setScale(Math.min(1, available / 1123))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [cert])

  const handleDownload = useCallback(async () => {
    if (!certRef.current || downloading) return
    setDownloading(true)
    try {
      const safeName = (cert?.student_name || 'certificate')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
      await downloadCertificatePdf(certRef.current, `Hidayat_Certificate_${safeName}`)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('Sorry, the certificate could not be downloaded. Please try again.')
    } finally {
      setDownloading(false)
    }
  }, [cert, downloading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-500 mt-4">Loading certificate…</p>
        </div>
      </div>
    )
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Certificate Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">
            This certificate does not exist or is no longer available.
          </p>
          <Link
            to="/short-courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft size={16} /> Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  const verifyUrl = `${window.location.origin}/certificate/verify/${cert.verification_code}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      {/* Top action bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/short-courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 min-h-[44px]"
          >
            <ArrowLeft size={16} /> Back to Courses
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              <ShieldCheck size={16} /> Verify
            </a>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Preparing PDF…
                </>
              ) : (
                <>
                  <Download size={16} /> Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Certificate preview */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div
            ref={wrapperRef}
            className="w-full flex justify-center overflow-hidden"
            style={{ height: 794 * scale }}
          >
            {/* Scaled wrapper keeps layout height correct while the inner
                node stays at its true 1123×794 size for crisp capture. */}
            <div
              style={{
                width: 1123,
                height: 794,
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.35)',
                borderRadius: 8,
              }}
            >
              <CertificateTemplate
                ref={certRef}
                studentName={cert.student_name}
                courseTitle={cert.course_title}
                instructorName={cert.instructor_name}
                certificateNumber={cert.certificate_number}
                verificationCode={cert.verification_code}
                issuedAt={cert.issued_at}
                verifyUrl={verifyUrl}
              />
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Tip: the downloaded PDF is high-resolution and print-ready (A4 landscape).
        </p>
      </div>
    </div>
  )
}
