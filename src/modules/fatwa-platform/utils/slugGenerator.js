/**
 * Generates a URL-friendly slug from a fatwa title/question.
 * Preserves Unicode characters (Urdu/Arabic) for readable URLs.
 *
 * - Trims whitespace
 * - Replaces slashes with hyphens (to avoid URL path conflicts)
 * - Replaces spaces with hyphens
 * - Collapses multiple consecutive hyphens
 * - Trims leading/trailing hyphens
 * - Appends ID suffix if slug already exists in the provided set
 *
 * @param {string} title - The fatwa title/question to slugify
 * @param {string|number} id - The unique fatwa ID (used for deduplication)
 * @param {Set<string>} existingSlugs - Set of already-used slugs
 * @returns {string} A unique, URL-safe slug
 */
export function generateSlug(title, id, existingSlugs = new Set()) {
  const input = typeof title === 'string' ? title : ''

  let slug = input
    .trim()
    .replace(/C-جامعہ-علوم-اسلامیہ-علامہ-محمد-یوسف-بنوری-ٹاؤن/g, '')
    .replace(/جامعہ علوم اسلامیہ علامہ محمد یوسف بنوری ٹاؤن/g, '')
    .replace(/[/\\]+/g, '-')         // Replace slashes with hyphens
    .replace(/[?#&=]+/g, '')         // Remove URL-unsafe query characters
    .replace(/\s+/g, '-')            // Replace spaces with hyphens
    .replace(/-+/g, '-')             // Collapse multiple hyphens
    .replace(/^-|-$/g, '')           // Trim leading/trailing hyphens

  // If slug is empty (e.g., no usable text), use the ID
  if (!slug) {
    slug = `fatwa-${String(id)}`
  }

  // Ensure uniqueness by appending ID if slug already exists
  if (existingSlugs.has(slug)) {
    slug = `${slug}-${String(id)}`
  }

  return slug
}
