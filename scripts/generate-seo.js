import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Load environment variables from .env
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PUBLIC_DIR = join(__dirname, '..', 'public')
const DIST_DIR = join(__dirname, '..', 'dist')
const BASE_URL = 'https://hidayat.org'

// Trim env values
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')
const SUPABASE_ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || '').trim()

const STATIC_PAGES = [
  '/',
  '/about',
  '/about/directors-message',
  '/about/mission-values',
  '/about/trainers',
  '/services',
  '/services/training',
  '/services/consultancy',
  '/services/distance-learning',
  '/events',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
  '/knowledge-test',
  '/darul-ifta',
  '/articles',
  '/downloads',
  '/fatwas',
]

function slugify(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

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

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function generateSEO() {
  console.log('\n🔍 Generating SEO, Sitemap, and Crawling Assets...\n')

  let fatwas = []
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { data, error } = await supabase
        .from('fatwa_questions')
        .select('slug, category_1, category_2, category_3, published_at')
        .eq('status', 'published')
        .not('slug', 'is', null)

      if (!error && data) {
        fatwas = data
        console.log(`  ✓ Successfully loaded ${fatwas.length} published fatwas from Supabase.`)
      } else {
        console.warn(`  ⚠ Supabase query failed: ${error?.message}. Using empty fatwas list.`)
      }
    } catch (err) {
      console.warn(`  ⚠ Failed to query Supabase: ${err.message}. Using empty fatwas list.`)
    }
  } else {
    console.warn('  ⚠ Supabase environment variables missing. Generating sitemap with static pages only.')
  }

  const urlEntries = []
  const todayStr = new Date().toISOString().split('T')[0]

  // 1. Add static pages
  for (const page of STATIC_PAGES) {
    const loc = escapeXml(`${BASE_URL}${page === '/' ? '' : page}`)
    urlEntries.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '/' ? '1.0' : '0.8'}</priority>
  </url>`)
  }

  // 2. Add unique category pages
  const categoryUrls = computeCategoryUrls(fatwas, BASE_URL)
  for (const categoryUrl of categoryUrls) {
    const loc = escapeXml(categoryUrl)
    urlEntries.push(`  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
  }

  // 3. Add dynamic fatwa pages
  for (const fatwa of fatwas) {
    const loc = escapeXml(`${BASE_URL}/fatwas/${fatwa.slug}`)
    const lastmod = fatwa.published_at
      ? new Date(fatwa.published_at).toISOString().split('T')[0]
      : todayStr
    urlEntries.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`

  // Robots.txt content
  const robotsTxt = `User-agent: *
Allow: /
Allow: /certificate/verify/

Disallow: /login
Disallow: /auth/callback
Disallow: /admin-dashboard/
Disallow: /short-courses/
Disallow: /wazifa/
Disallow: /reports/
Disallow: /student-admin/
Disallow: /scholar-admin/
Disallow: /certificate/

Sitemap: ${BASE_URL}/sitemap.xml
`

  // llms.txt content
  const llmsTxt = `# Hidayat

Islamic Knowledge & Professional Development Platform. Hidayat provides traditional Islamic education, professional capacity building, shariah compliance services, research materials, and an online Darul Ifta answering platform.

## Main Sections

- [Hidayat Homepage](https://hidayat.org/) - Main platform info, academy services, news, message from Director.
- [Darul Ifta / Fatwas](https://hidayat.org/darul-ifta) - Scholarly vetted fatwas library, Q&A service.
- [About Us](https://hidayat.org/about) - Credentials, organization structure, and mission.
- [Services](https://hidayat.org/services) - Shariah advisory, training, consultancy, and distance learning.
- [Articles & Downloads](https://hidayat.org/articles) - Islamic essays, research publications, and study guides.
- [Contact Info](https://hidayat.org/contact) - Location, official emails, and phone coordinates.

## Contact

- Email: info@hidayat.org
- WhatsApp: Ask on WhatsApp via widget on Darul Ifta
`

  // Helper function to write to target files
  const writeSEOFile = (filename, content) => {
    if (existsSync(PUBLIC_DIR)) {
      writeFileSync(join(PUBLIC_DIR, filename), content, 'utf-8')
      console.log(`  ✓ Written public/${filename}`)
    }
    if (existsSync(DIST_DIR)) {
      writeFileSync(join(DIST_DIR, filename), content, 'utf-8')
      console.log(`  ✓ Written dist/${filename}`)
    }
  }

  // Create dist/ if it doesn't exist yet (for clean builds)
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true })
  }

  writeSEOFile('sitemap.xml', sitemapXml)
  writeSEOFile('robots.txt', robotsTxt)
  writeSEOFile('llms.txt', llmsTxt)

  console.log('\n✅ SEO files successfully generated.\n')
}

generateSEO().catch(err => {
  console.error('SEO generation failed:', err)
  process.exit(1)
})
