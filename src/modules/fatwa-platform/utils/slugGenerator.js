/**
 * Slugify helper that supports lowercase ASCII alphanumeric text and hyphens.
 * Produces URL-friendly strings matching /^[a-z0-9]+(-[a-z0-9]+)*$/.
 * Replaces spaces, slashes, and special characters with hyphens or removes them.
 *
 * @param {string} text - Text to slugify
 * @returns {string} URL-safe slug
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return ''

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')     // Remove non-alphanumeric characters (except space/hyphen)
    .trim()
    .replace(/[\s_]+/g, '-')          // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-')             // Collapse multiple hyphens
    .replace(/^-|-$/g, '')           // Trim leading/trailing hyphens
}

/**
 * Generates a URL-friendly slug from a fatwa title/question.
 * Preserves alphanumeric characters and matches formatting regex.
 * Appends ID suffix if slug already exists in the provided set.
 *
 * @param {string} title - The fatwa title/question to slugify
 * @param {string|number} id - The unique fatwa ID (used for deduplication)
 * @param {Set<string>} existingSlugs - Set of already-used slugs
 * @returns {string} A unique, URL-safe slug
 */
export function generateSlug(title, id, existingSlugs = new Set()) {
  let slug = slugify(title)

  // Truncate to 80 chars max (safe limit before appending ID if needed)
  if (slug.length > 80) {
    slug = slug.slice(0, 80).replace(/-$/, '')
  }

  const cleanId = String(id).toLowerCase().replace(/[^a-z0-9]/g, '')
  const safeId = cleanId || 'id'

  // If slug is empty (e.g., all characters were non-latin), use the ID
  if (!slug) {
    slug = `fatwa-${safeId}`
  }

  // Ensure uniqueness by appending ID if slug already exists
  if (existingSlugs.has(slug)) {
    slug = `${slug}-${safeId}`
  }

  return slug
}
