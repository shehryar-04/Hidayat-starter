/**
 * Backfill Slugs Script
 *
 * Generates URL-friendly slugs for all fatwas in the database.
 * Preserves Unicode characters (Urdu/Arabic) for readable URLs.
 * Ensures uniqueness by appending fatwa_number suffix on collision.
 *
 * Usage:
 *   node scripts/search/backfill-slugs.js [--batch-size=500] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const args = process.argv.slice(2)
const batchSize = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '500', 10)
const dryRun = args.includes('--dry-run')

/**
 * Generate a URL-safe slug from text.
 * Preserves Unicode (Urdu/Arabic) while making it URL-friendly.
 */
function slugify(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .trim()
    .replace(/[/\\]+/g, '-')
    .replace(/[?#&=]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200) // Limit slug length
}

async function main() {
  console.log(`\n🔗 Hidayat Slug Backfill`)
  console.log(`   Batch size: ${batchSize}`)
  console.log(`   Dry run: ${dryRun}\n`)

  // Count fatwas without slugs
  const { count: totalWithout } = await supabase
    .from('fatwas')
    .select('id', { count: 'exact', head: true })
    .is('slug', null)

  console.log(`📊 Fatwas without slugs: ${totalWithout}`)

  if (totalWithout === 0) {
    console.log('✅ All fatwas already have slugs!')
    return
  }

  // Track used slugs to ensure uniqueness
  const usedSlugs = new Set()

  // First, load all existing slugs
  let existingOffset = 0
  while (true) {
    const { data } = await supabase
      .from('fatwas')
      .select('slug')
      .not('slug', 'is', null)
      .range(existingOffset, existingOffset + 1000 - 1)

    if (!data || data.length === 0) break
    for (const row of data) {
      if (row.slug) usedSlugs.add(row.slug)
    }
    existingOffset += 1000
  }

  console.log(`📊 Existing slugs loaded: ${usedSlugs.size}`)

  let offset = 0
  let processed = 0
  const startTime = Date.now()

  while (true) {
    const { data: batch, error } = await supabase
      .from('fatwas')
      .select('id, title, question, fatwa_number')
      .is('slug', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error(`❌ Fetch error: ${error.message}`)
      break
    }

    if (!batch || batch.length === 0) break

    // Generate slugs
    const updates = []
    for (const fatwa of batch) {
      const baseText = fatwa.title || fatwa.question || fatwa.fatwa_number
      let slug = slugify(baseText)

      if (!slug) {
        slug = `fatwa-${fatwa.fatwa_number || fatwa.id.slice(0, 8)}`
      }

      // Ensure uniqueness
      if (usedSlugs.has(slug)) {
        slug = `${slug}-${fatwa.fatwa_number || fatwa.id.slice(0, 8)}`
      }

      // Final uniqueness check
      let attempt = 0
      let finalSlug = slug
      while (usedSlugs.has(finalSlug)) {
        attempt++
        finalSlug = `${slug}-${attempt}`
      }

      usedSlugs.add(finalSlug)
      updates.push({ id: fatwa.id, slug: finalSlug })
    }

    if (!dryRun) {
      // Update in batches of 100 to avoid payload limits
      for (let i = 0; i < updates.length; i += 100) {
        const chunk = updates.slice(i, i + 100)
        for (const update of chunk) {
          const { error: updateError } = await supabase
            .from('fatwas')
            .update({ slug: update.slug })
            .eq('id', update.id)

          if (updateError) {
            console.error(`❌ Update error for ${update.id}: ${updateError.message}`)
          }
        }
      }
    }

    processed += batch.length
    offset += batchSize

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`   ✅ Processed: ${processed}/${totalWithout} | Elapsed: ${elapsed}s`)
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n🎉 Done! Generated slugs for ${processed} fatwas in ${totalTime}s`)
  if (dryRun) console.log('   (DRY RUN — no changes written)')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
