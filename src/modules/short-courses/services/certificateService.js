/**
 * Certificate Service
 * Handles certificate generation, retrieval, and verification.
 */

import { supabase } from '../../../lib/supabase'

/**
 * Check if student is eligible for a certificate.
 */
export async function checkEligibility(studentId, courseId) {
  const { data } = await supabase.rpc('check_certificate_eligibility', {
    p_student_id: studentId,
    p_course_id: courseId,
  })
  return data === true
}

/**
 * Generate a certificate for a student who completed a course.
 */
export async function generateCertificate(studentId, courseId, studentName, courseTitle, instructorName) {
  // Check if already has certificate
  const { data: existing } = await supabase
    .from('certificates')
    .select('id, certificate_number, verification_code')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .limit(1)
    .maybeSingle()

  if (existing) return existing

  // Generate certificate number and verification code
  const { data: certNumber } = await supabase.rpc('generate_certificate_number')
  const { data: verCode } = await supabase.rpc('generate_verification_code')

  const { data: cert, error } = await supabase
    .from('certificates')
    .insert({
      student_id: studentId,
      course_id: courseId,
      certificate_number: certNumber,
      verification_code: verCode,
      student_name: studentName,
      course_title: courseTitle,
      instructor_name: instructorName || 'Hidayat Academy',
      is_active: true,
    })
    .select('*')
    .single()

  if (error) throw error
  return cert
}

/**
 * Get all certificates for a student.
 */
export async function getStudentCertificates(studentId) {
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .order('issued_at', { ascending: false })

  return data || []
}

/**
 * Verify a certificate by its verification code (public).
 * Uses the secure HMAC-based verification RPC when available,
 * falls back to the legacy RPC otherwise.
 */
export async function verifyCertificate(verificationCode) {
  // Try the hardened HMAC-based verification first
  const { data: secureData, error: secureErr } = await supabase.rpc('verify_certificate_secure', {
    p_code: verificationCode,
  })

  if (!secureErr && secureData && secureData.length > 0) {
    const cert = secureData[0]
    return {
      valid: cert.valid,
      certificate_number: cert.certificate_number,
      student_name: cert.student_name,
      course_title: cert.course_title,
      instructor_name: cert.instructor_name,
      issued_at: cert.issued_at,
      is_active: cert.is_active,
      signature_valid: cert.signature_valid,
    }
  }

  // Fallback to legacy verification
  const { data } = await supabase.rpc('verify_certificate', {
    p_code: verificationCode,
  })

  if (data && data.length > 0) {
    return { valid: true, ...data[0] }
  }
  return { valid: false }
}

/**
 * Get a certificate by ID.
 */
export async function getCertificateById(certId) {
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', certId)
    .single()

  return data
}
