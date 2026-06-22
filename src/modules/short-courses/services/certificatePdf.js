/**
 * Certificate PDF Generation — Pure jsPDF approach.
 *
 * Draws the certificate directly on a jsPDF canvas for pixel-perfect
 * text rendering without html2canvas word-spacing bugs.
 *
 * Generates a stunning A4-landscape PDF with:
 * - Emerald/gold color scheme
 * - Decorative borders and corner elements
 * - Proper text spacing guaranteed
 * - QR code from external service
 */

/**
 * Generate and download a certificate PDF.
 *
 * @param {{
 *   studentName: string,
 *   courseTitle: string,
 *   instructorName: string,
 *   certificateNumber: string,
 *   verificationCode: string,
 *   issuedAt: string,
 *   verifyUrl: string,
 * }} data
 * @returns {Promise<void>}
 */
export async function downloadCertificatePdf(element, fileName = 'certificate', data = null) {
  // If data is provided, use pure jsPDF rendering (preferred).
  // If not, fall back to the element-based approach (legacy).
  if (data) {
    return generatePurePdf(data, fileName)
  }

  // Fallback: html2canvas (legacy path, kept for compatibility but not recommended)
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgRatio = canvas.width / canvas.height
  const pageRatio = pageWidth / pageHeight
  let renderWidth = pageWidth, renderHeight = pageHeight
  if (imgRatio > pageRatio) renderHeight = pageWidth / imgRatio
  else renderWidth = pageHeight * imgRatio
  const offsetX = (pageWidth - renderWidth) / 2
  const offsetY = (pageHeight - renderHeight) / 2
  pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight)
  pdf.save(`${fileName}.pdf`)
}

/**
 * Pure jsPDF rendering — no html2canvas, no word-spacing bugs.
 */
async function generatePurePdf(data, fileName) {
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()   // 297mm
  const H = pdf.internal.pageSize.getHeight()  // 210mm
  const cx = W / 2

  // Colors
  const EMERALD = [12, 74, 50]
  const GOLD = [191, 155, 70]
  const IVORY = [253, 251, 242]
  const GRAY = [107, 107, 94]
  const DARK_GREEN = [31, 61, 47]

  // ═══ Background ═══
  pdf.setFillColor(...EMERALD)
  pdf.rect(0, 0, W, H, 'F')

  // Ivory parchment inner area
  const m = 10 // margin
  pdf.setFillColor(...IVORY)
  pdf.roundedRect(m, m, W - 2 * m, H - 2 * m, 2, 2, 'F')

  // Gold border (double line)
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.8)
  pdf.roundedRect(m + 3, m + 3, W - 2 * m - 6, H - 2 * m - 6, 1.5, 1.5, 'S')
  pdf.setLineWidth(0.3)
  pdf.roundedRect(m + 6, m + 6, W - 2 * m - 12, H - 2 * m - 12, 1, 1, 'S')

  // Corner decorations (small gold circles at corners)
  const corners = [
    [m + 8, m + 8], [W - m - 8, m + 8],
    [m + 8, H - m - 8], [W - m - 8, H - m - 8],
  ]
  pdf.setFillColor(...GOLD)
  for (const [x, y] of corners) {
    pdf.circle(x, y, 1.5, 'F')
  }

  // ═══ Header ═══
  let y = 30

  // Load and add the Hidayat logo
  try {
    const logoImg = await loadImage('/assets/LOGO_HIDAYAT.png')
    pdf.addImage(logoImg, 'PNG', cx - 7, y - 8, 14, 14)
    y += 10
  } catch {
    // Logo load failed — continue without it
    y += 2
  }

  // "HIDAYAT ACADEMY"
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.setTextColor(...EMERALD)
  pdf.text('HIDAYAT ACADEMY', cx, y, { align: 'center' })
  y += 14

  // ═══ Title ═══
  pdf.setFont('times', 'bolditalic')
  pdf.setFontSize(36)
  pdf.setTextColor(...EMERALD)
  pdf.text('Certificate', cx, y, { align: 'center' })
  y += 8

  // "OF COMPLETION"
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(...GOLD)
  pdf.text('OF COMPLETION', cx, y, { align: 'center', charSpace: 3 })
  y += 6

  // Gold decorative line
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.4)
  pdf.line(cx - 30, y, cx + 30, y)
  y += 4

  // Small star in center
  pdf.setFillColor(...GOLD)
  drawStar(pdf, cx, y, 2)
  y += 10

  // ═══ "This certificate is proudly presented to" ═══
  pdf.setFont('times', 'normal')
  pdf.setFontSize(12)
  pdf.setTextColor(...GRAY)
  pdf.text('This certificate is proudly presented to', cx, y, { align: 'center' })
  y += 14

  // ═══ Student Name ═══
  pdf.setFont('times', 'bolditalic')
  pdf.setFontSize(38)
  pdf.setTextColor(...EMERALD)
  pdf.text(data.studentName || 'Student', cx, y, { align: 'center' })
  y += 6

  // Underline accent
  const nameWidth = Math.min(pdf.getTextWidth(data.studentName || 'Student'), 120)
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.5)
  pdf.line(cx - nameWidth / 2, y, cx + nameWidth / 2, y)
  y += 12

  // ═══ "for successfully completing all requirements of the course" ═══
  pdf.setFont('times', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(...GRAY)
  pdf.text('for successfully completing all requirements of the course', cx, y, { align: 'center' })
  y += 12

  // ═══ Course Title ═══
  pdf.setFont('times', 'bold')
  pdf.setFontSize(18)
  pdf.setTextColor(...DARK_GREEN)
  // Wrap long course titles
  const titleLines = pdf.splitTextToSize(data.courseTitle || 'Course', 200)
  pdf.text(titleLines, cx, y, { align: 'center' })
  y += titleLines.length * 8

  // ═══ Footer Section ═══
  const footerY = H - 45

  // Left: Date
  pdf.setFont('times', 'bolditalic')
  pdf.setFontSize(12)
  pdf.setTextColor(...EMERALD)
  const dateStr = data.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  pdf.text(dateStr, 45, footerY, { align: 'center' })
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.3)
  pdf.line(20, footerY + 2, 70, footerY + 2)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(...GRAY)
  pdf.text('DATE ISSUED', 45, footerY + 7, { align: 'center' })

  // Right: Instructor
  pdf.setFont('times', 'bolditalic')
  pdf.setFontSize(12)
  pdf.setTextColor(...EMERALD)
  pdf.text(data.instructorName || 'Hidayat Academy', W - 45, footerY, { align: 'center' })
  pdf.setDrawColor(...GOLD)
  pdf.line(W - 70, footerY + 2, W - 20, footerY + 2)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(...GRAY)
  pdf.text('INSTRUCTOR', W - 45, footerY + 7, { align: 'center' })

  // Center: Seal (circle with star)
  pdf.setFillColor(...GOLD)
  pdf.circle(cx, footerY - 2, 12, 'F')
  pdf.setFillColor(...EMERALD)
  pdf.circle(cx, footerY - 2, 10, 'F')
  drawStar(pdf, cx, footerY - 2, 6)
  pdf.setFillColor(...GOLD)
  drawStar(pdf, cx, footerY - 2, 6)

  // ═══ Bottom: Verification + Certificate Number ═══
  const bottomY = H - 18

  // QR code (loaded as image) — large and prominent
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(data.verifyUrl)}`
  try {
    const qrImg = await loadImage(qrUrl)
    pdf.addImage(qrImg, 'PNG', 16, bottomY - 16, 22, 22)
  } catch {
    // QR load failed — skip silently
  }

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.setTextColor(...GRAY)
  pdf.text('VERIFY AT', 40, bottomY - 10)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(...EMERALD)
  pdf.text('hidayat.pk/certificate', 40, bottomY - 5)
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(...GRAY)
  pdf.text(data.verificationCode || '', 40, bottomY)

  // Certificate number (bottom right)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.setTextColor(...GRAY)
  pdf.text('CERTIFICATE NO.', W - 20, bottomY - 5, { align: 'right' })
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...EMERALD)
  pdf.text(data.certificateNumber || '', W - 20, bottomY, { align: 'right' })

  // Save
  pdf.save(`${fileName}.pdf`)
}

/** Draw a simple 5-point star. */
function drawStar(pdf, cx, cy, r) {
  const points = []
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  // Draw as filled polygon
  pdf.triangle(
    points[0][0], points[0][1],
    points[1][0], points[1][1],
    points[2][0], points[2][1],
    'F'
  )
  pdf.triangle(
    points[0][0], points[0][1],
    points[2][0], points[2][1],
    points[3][0], points[3][1],
    'F'
  )
  pdf.triangle(
    points[0][0], points[0][1],
    points[3][0], points[3][1],
    points[4][0], points[4][1],
    'F'
  )
}

/** Load an image URL as a base64 data URL. */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}
