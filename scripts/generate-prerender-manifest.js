/**
 * Generate a prerender manifest file listing all dynamic routes
 * that should be pre-rendered at build time.
 *
 * This script queries Supabase for all published fatwas and their categories,
 * then writes a manifest file (dist/prerender-manifest.json) that the
 * prerender script uses to know which pages to crawl.
 *
 * Usage:
 *   node scripts/generate-prerender-manifest.js
 *
 * Environment variables required:
 *   VITE_SUPABASE_URL - Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Supabase anonymous key
 *
 * Output:
 *   dist/prerender-manifest.json
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Load environment variables from .env
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DIST_DIR = join(__dirname, '..', 'dist')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

async function generateManifest() {
  console.log('\n📋 Generating prerender manifest\n')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('  ⚠ Supabase credentials not found in environment.')
    console.warn('  Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to generate dynamic routes.')
    console.log('  Generating manifest with static routes only.\n')
    writeManifest([])
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    // Fetch all published fatwas (slug and categories)
    const { data: fatwas, error } = await supabase
      .from('fatwa_questions')
      .select('slug, category_1, category_2, category_3')
      .eq('status', 'published')
      .not('slug', 'is', null)

    if (error) {
      console.error(`  ✗ Supabase query failed: ${error.message}`)
      writeManifest([])
      return
    }

    const routes = new Set()

    // Add fatwa detail routes
    for (const fatwa of fatwas) {
      if (fatwa.slug) {
        routes.add(`/fatwas/${fatwa.slug}`)
      }

      // Add category routes
      if (fatwa.category_1) {
        const cat1Slug = slugify(fatwa.category_1)
        routes.add(`/fatwas/category/${cat1Slug}`)

        if (fatwa.category_2) {
          const cat2Slug = slugify(fatwa.category_2)
          routes.add(`/fatwas/category/${cat1Slug}/${cat2Slug}`)

          if (fatwa.category_3) {
            const cat3Slug = slugify(fatwa.category_3)
            routes.add(`/fatwas/category/${cat1Slug}/${cat2Slug}/${cat3Slug}`)
          }
        }
      }
    }

    const routeArray = Array.from(routes)
    console.log(`  Found ${fatwas.length} published fatwas`)
    console.log(`  Generated ${routeArray.length} dynamic routes`)

    writeManifest(routeArray)
  } catch (error) {
    console.error(`  ✗ Error generating manifest: ${error.message}`)
    writeManifest([])
  }
}

/**
 * Simple slug helper for category names.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Write the manifest file to dist/.
 */
function writeManifest(routes) {
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true })
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    routes,
  }

  const outputPath = join(DIST_DIR, 'prerender-manifest.json')
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8')
  console.log(`  ✓ Manifest written to ${outputPath}\n`)
}

generateManifest().catch((error) => {
  console.error('Manifest generation failed:', error)
  process.exit(1)
})
