import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldX, Award } from 'lucide-react'
import { verifyCertificate } from './services/certificateService'
import { Spinner } from '../../shared/ui'

/**
 * CertificateVerifyPage — Public verification page.
 * Route: /certificate/verify/:code
 * No login required. Validates certificate authenticity.
 */
export default function CertificateVerifyPage() {
  const { code } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (code) verify()
  }, [code])

  const verify = async () => {
    setLoading(true)
    try {
      const res = await verifyCertificate(code)
      setResult(res)
    } catch {
      setResult({ valid: false })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-500 mt-4">Verifying certificate...</p>
        </div>
      </div>
    )
  }

  if (!result || !result.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center"
        >
          <ShieldX className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Certificate Not Found</h1>
          <p className="text-gray-600 mb-4">
            The verification code <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{code}</code> does not match any valid certificate.
          </p>
          <p className="text-sm text-gray-500">
            This certificate may be invalid, revoked, or the code may be incorrect.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Verified Badge */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center mb-6">
          <ShieldCheck className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-700 mb-1">Certificate Verified ✓</h1>
          <p className="text-green-600 text-sm">This is an authentic Hidayat Academy certificate.</p>
        </div>

        {/* Certificate Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Award className="w-10 h-10 text-primary-500" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Certificate of Completion</p>
              <p className="text-sm font-bold text-gray-800">{result.certificate_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Detail label="Student Name" value={result.student_name} />
            <Detail label="Course" value={result.course_title} />
            <Detail label="Instructor" value={result.instructor_name} />
            <Detail label="Date Issued" value={new Date(result.issued_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })} />
            <Detail label="Status" value={result.is_active ? '✓ Active' : '✗ Revoked'}
              valueClass={result.is_active ? 'text-green-600 font-bold' : 'text-red-600 font-bold'} />
            {result.signature_valid !== null && result.signature_valid !== undefined && (
              <Detail
                label="Digital Signature"
                value={result.signature_valid ? '✓ Cryptographically Verified' : '⚠ Signature Mismatch'}
                valueClass={result.signature_valid ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Issued by Hidayat Academy · hidayat.org
        </p>
      </motion.div>
    </div>
  )
}

function Detail({ label, value, valueClass = '' }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm text-gray-800 font-medium ${valueClass}`}>{value || '—'}</p>
    </div>
  )
}
