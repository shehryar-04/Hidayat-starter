/**
 * Sitemap and robots.txt generators for the Fatwa Knowledge Platform.
 *
 * - generateSitemap(fatwas, baseUrl) — returns an XML sitemap string
 * - generateRobotsTxt(sitemapUrl) — returns a robots.txt string
 *
 * The sitemap includes:
 * - One <url> entry per published fatwa canonical URL ({baseUrl}/fatwas/{slug})
 * - One <url> entry per unique category page URL (cat1, cat1/cat2, cat1/cat2/cat3)
 */

/**
 * Simple slugify helper for category names.
 * Produces URL-friendly lowercase strings with hyphens.
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Compute unique category page URLs from a list of fatwas.
 * Each fatwa can have category_1, category_2, category_3.
 * Category pages exist at:
 *   - {baseUrl}/fatwas/category/{cat1Slug}
 *   - {baseUrl}/fatwas/category/{cat1Slug}/{cat2Slug}
 *   - {baseUrl}/fatwas/category/{cat1Slug}/{cat2Slug}/{cat3Slug}
 *
 * @param {Array} fatwas - Array of fatwa objects
 * @param {string} baseUrl - The base URL of the site
 * @returns {string[]} Array of unique category page URLs
 */
function computeCategoryUrls(fatwas, baseUrl) {
  const categoryPaths = new Set()

  for (const fatwa of fatwas) {
    const cat1 = fatwa.category_1
    const cat2 = fatwa.category_2
    const cat3 = fatwa.category_3

    if (cat1) {
      const cat1Slug = slugify(cat1)
      if (cat1Slug) {
        categoryPaths.add(`${baseUrl}/fatwas/category/${cat1Slug}`)

        if (cat2) {
          const cat2Slug = slugify(cat2)
          if (cat2Slug) {
            categoryPaths.add(`${baseUrl}/fatwas/category/${cat1Slug}/${cat2Slug}`)

            if (cat3) {
              const cat3Slug = slugify(cat3)
              if (cat3Slug) {
                categoryPaths.add(`${baseUrl}/fatwas/category/${cat1Slug}/${cat2Slug}/${cat3Slug}`)
              }
            }
          }
        }
      }
    }
  }

  return Array.from(categoryPaths)
}

/**
 * Escape special XML characters in a string.
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generate an XML sitemap string for the given published fatwas.
 *
 * Each published fatwa gets one <url> entry with loc = {baseUrl}/fatwas/{slug}.
 * Each unique category page also gets one <url> entry.
 *
 * @param {Array<{slug: string, published_at?: string, category_1?: string, category_2?: string, category_3?: string}>} fatwas
 *   Array of published fatwa objects. Each must have a `slug` property.
 * @param {string} baseUrl - The base URL (e.g., "https://hidayat.org")
 * @returns {string} XML sitemap string
 */
export function generateSitemap(fatwas, baseUrl) {
  // Normalize baseUrl: remove trailing slash
  const base = baseUrl.replace(/\/+$/, '')

  const urlEntries = []

  // Add one <url> entry per published fatwa
  for (const fatwa of fatwas) {
    if (!fatwa.slug) continue

    const loc = escapeXml(`${base}/fatwas/${fatwa.slug}`)
    const lastmod = fatwa.published_at
      ? `\n    <lastmod>${new Date(fatwa.published_at).toISOString().split('T')[0]}</lastmod>`
      : ''

    urlEntries.push(`  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`)
  }

  // Add one <url> entry per unique category page
  const categoryUrls = computeCategoryUrls(fatwas, base)
  for (const categoryUrl of categoryUrls) {
    urlEntries.push(`  <url>\n    <loc>${escapeXml(categoryUrl)}</loc>\n  </url>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`
}

/**
 * Generate a robots.txt string that references the given sitemap URL.
 *
 * @param {string} sitemapUrl - The full URL to the sitemap (e.g., "https://hidayat.org/sitemap.xml")
 * @returns {string} robots.txt content
 */
export function generateRobotsTxt(sitemapUrl) {
  return `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}`
}
