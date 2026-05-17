/**
 * Pre-rendering script for the Fatwa Knowledge Platform.
 *
 * Generates static HTML for published fatwa pages, category pages, and the homepage
 * at build time. This ensures search engine crawlers receive fully rendered HTML with
 * meta tags and structured data without needing JavaScript execution.
 *
 * Usage:
 *   node scripts/prerender.js
 *
 * Prerequisites:
 *   - Run `npm run build` first to generate the dist/ folder
 *   - Puppeteer must be installed as a dev dependency
 *
 * The script:
 *   1. Serves the built dist/ folder on a local HTTP server
 *   2. Crawls predefined routes (homepage, search, category pages)
 *   3. Waits for react-helmet-async to inject meta tags
 *   4. Saves the fully rendered HTML to the corresponding dist/ path
 *   5. Verifies meta tags and structured data are present in output
 */

import { launch } from 'puppeteer'
import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DIST_DIR = join(__dirname, '..', 'dist')
const PORT = 4173

/**
 * Static routes that are always pre-rendered.
 * Dynamic fatwa routes (/fatwas/:slug) and category routes are added
 * at build time by reading from the Supabase database or a manifest file.
 */
const STATIC_ROUTES = [
  '/fatwas',
  '/fatwas/search',
]

/**
 * Serve the dist directory on a local HTTP server.
 * Falls back to index.html for SPA client-side routing.
 */
function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  }

  const server = createServer((req, res) => {
    let filePath = join(distDir, req.url === '/' ? 'index.html' : req.url)

    // SPA fallback: serve index.html for routes without file extensions
    if (!filePath.includes('.') || !existsSync(filePath)) {
      filePath = join(distDir, 'index.html')
    }

    try {
      const content = readFileSync(filePath)
      const ext = '.' + filePath.split('.').pop()
      const contentType = mimeTypes[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    } catch {
      // Fallback to index.html for any missing file (SPA routing)
      const indexContent = readFileSync(join(distDir, 'index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(indexContent)
    }
  })

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`  Static server running on http://localhost:${port}`)
      resolve(server)
    })
  })
}

/**
 * Render a single route and save the HTML output.
 * Waits for the page to be fully rendered including react-helmet-async meta tags.
 */
async function renderRoute(browser, route, baseUrl) {
  const page = await browser.newPage()

  try {
    const url = `${baseUrl}${route}`
    console.log(`  Rendering: ${route}`)

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

    // Wait for react-helmet-async to inject meta tags into <head>
    await page.waitForFunction(
      () => {
        const title = document.querySelector('title')
        return title && title.textContent && title.textContent.length > 0
      },
      { timeout: 10000 }
    ).catch(() => {
      console.warn(`    Warning: Title tag not detected for ${route}, proceeding anyway`)
    })

    // Small delay to ensure all async rendering completes
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Get the fully rendered HTML
    const html = await page.content()

    // Determine output path
    const outputPath = getOutputPath(route)
    const outputDir = dirname(outputPath)

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    writeFileSync(outputPath, html, 'utf-8')

    // Verify meta tags and structured data presence
    const verification = verifyRenderedHTML(html, route)
    if (verification.warnings.length > 0) {
      verification.warnings.forEach((w) => console.warn(`    ⚠ ${w}`))
    }
    if (verification.passed) {
      console.log(`    ✓ Meta tags and structured data verified`)
    }

    return { route, success: true, verification }
  } catch (error) {
    console.error(`    ✗ Failed to render ${route}: ${error.message}`)
    return { route, success: false, error: error.message }
  } finally {
    await page.close()
  }
}

/**
 * Convert a route path to a file system output path.
 * e.g., /fatwas → dist/fatwas/index.html
 *       /fatwas/search → dist/fatwas/search/index.html
 */
function getOutputPath(route) {
  const cleanRoute = route === '/' ? '' : route
  return join(DIST_DIR, cleanRoute, 'index.html')
}

/**
 * Verify that the rendered HTML contains expected SEO elements.
 */
function verifyRenderedHTML(html, route) {
  const warnings = []
  let passed = true

  // Check for meta description
  if (!html.includes('<meta name="description"') && !html.includes('<meta property="og:description"')) {
    warnings.push('Missing meta description tag')
    passed = false
  }

  // Check for Open Graph tags
  if (!html.includes('og:title')) {
    warnings.push('Missing Open Graph title tag')
    passed = false
  }

  // Check for structured data (JSON-LD)
  if (!html.includes('application/ld+json')) {
    // Structured data is expected on fatwa detail and homepage, not necessarily search
    if (route !== '/fatwas/search') {
      warnings.push('Missing JSON-LD structured data')
    }
  }

  // Check for canonical URL
  if (!html.includes('rel="canonical"')) {
    warnings.push('Missing canonical URL link tag')
  }

  // Check that the root div has content (not empty SPA shell)
  if (html.includes('<div id="root"></div>') || html.includes('<div id="root"> </div>')) {
    warnings.push('Root element appears empty — React may not have rendered')
    passed = false
  }

  return { passed, warnings }
}

/**
 * Load dynamic routes from a manifest file if available.
 * The manifest is generated by the sitemap generator or a build step
 * that queries Supabase for all published fatwas and categories.
 */
function loadDynamicRoutes() {
  const manifestPath = join(DIST_DIR, 'prerender-manifest.json')

  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      console.log(`  Loaded ${manifest.routes?.length || 0} dynamic routes from manifest`)
      return manifest.routes || []
    } catch (error) {
      console.warn(`  Warning: Could not parse prerender manifest: ${error.message}`)
      return []
    }
  }

  console.log('  No prerender manifest found — only static routes will be pre-rendered')
  console.log('  To pre-render dynamic pages, generate dist/prerender-manifest.json before running this script')
  return []
}

/**
 * Main pre-rendering entry point.
 */
async function prerender() {
  console.log('\n🔄 Fatwa Platform Pre-rendering\n')

  // Verify dist directory exists
  if (!existsSync(DIST_DIR)) {
    console.error('  ✗ dist/ directory not found. Run `npm run build` first.')
    process.exit(1)
  }

  // Collect all routes to pre-render
  const dynamicRoutes = loadDynamicRoutes()
  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes]

  console.log(`  Routes to pre-render: ${allRoutes.length}`)
  console.log('')

  // Start local server
  const server = await createStaticServer(DIST_DIR, PORT)
  const baseUrl = `http://localhost:${PORT}`

  // Launch Puppeteer
  const browser = await launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const results = []

    for (const route of allRoutes) {
      const result = await renderRoute(browser, route, baseUrl)
      results.push(result)
    }

    // Summary
    console.log('\n📊 Pre-rendering Summary\n')
    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length
    console.log(`  ✓ Succeeded: ${succeeded}`)
    if (failed > 0) {
      console.log(`  ✗ Failed: ${failed}`)
      results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`    - ${r.route}: ${r.error}`))
    }
    console.log('')

    if (failed > 0) {
      console.warn('  Some pages failed to pre-render. They will fall back to client-side rendering.')
    }
  } finally {
    await browser.close()
    server.close()
  }

  console.log('✅ Pre-rendering complete\n')
}

prerender().catch((error) => {
  console.error('Pre-rendering failed:', error)
  process.exit(1)
})
