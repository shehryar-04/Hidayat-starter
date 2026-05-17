/**
 * Generates a URL-friendly slug from a fatwa title.
 *
 * - Converts to lowercase
 * - Removes non-alphanumeric characters (except spaces and hyphens)
 * - Replaces spaces with hyphens
 * - Collapses multiple consecutive hyphens
 * - Trims leading/trailing hyphens
 * - Truncates to max 80 characters
 * - Appends fatwa_number if slug already exists in the provided set
 *
 * @param {string} title - The fatwa title to slugify
 * @param {string|number} fatwaNumber - The unique fatwa reference number
 * @param {Set<string>} existingSlugs - Set of already-used slugs
 * @returns {string} A unique, URL-safe slug
 */
export function generateSlug(title, fatwaNumber, existingSlugs = new Set()) {
  // Handle edge cases: empty or non-string input
  const input = typeof title === 'string' ? title : ''

  // Sanitize fatwaNumber: convert to string, lowercase, keep only alphanumeric/hyphens
  const sanitizedNumber = String(fatwaNumber)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '0'

  let slug = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // Remove non-alphanumeric (keep spaces and hyphens)
    .replace(/\s+/g, '-')            // Replace spaces with hyphens
    .replace(/-+/g, '-')             // Collapse multiple hyphens
    .replace(/^-|-$/g, '')           // Trim leading/trailing hyphens
    .slice(0, 80)                    // Max 80 characters
    .replace(/^-|-$/g, '')           // Trim again after slice (slice may expose trailing hyphen)

  // If slug is empty after processing (e.g., all-special-character input),
  // use the fatwa number as the slug
  if (!slug) {
    slug = `fatwa-${sanitizedNumber}`
  }

  // Ensure uniqueness by appending fatwa number if slug already exists
  if (existingSlugs.has(slug)) {
    slug = `${slug}-${sanitizedNumber}`
  }

  return slug
}
