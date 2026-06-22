/**
 * Certificate PDF Generation
 *
 * Captures a rendered certificate DOM node and exports it as a
 * high-resolution A4 landscape PDF using html2canvas + jsPDF.
 */

/**
 * Generate and download a PDF from a certificate DOM element.
 *
 * @param {HTMLElement} element - The certificate node to capture.
 * @param {string} fileName - Download file name (without extension).
 * @returns {Promise<void>}
 */
export async function downloadCertificatePdf(element, fileName = 'certificate') {
  if (!element) throw new Error('Certificate element not found')

  // Lazy-load heavy libs so they are only fetched when a user downloads.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  // Render at 2x for crisp output.
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')

  // A4 landscape in mm.
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Fit the captured image to the page while preserving aspect ratio.
  const imgRatio = canvas.width / canvas.height
  const pageRatio = pageWidth / pageHeight

  let renderWidth = pageWidth
  let renderHeight = pageHeight
  if (imgRatio > pageRatio) {
    renderHeight = pageWidth / imgRatio
  } else {
    renderWidth = pageHeight * imgRatio
  }

  const offsetX = (pageWidth - renderWidth) / 2
  const offsetY = (pageHeight - renderHeight) / 2

  pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight)
  pdf.save(`${fileName}.pdf`)
}
