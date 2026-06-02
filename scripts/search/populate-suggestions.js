/**
 * Hidayat Enterprise Search — Precompute Search Suggestions
 *
 * Populates the search_suggestions table from:
 * - Fatwa titles (most common terms)
 * - Category names (all 3 levels)
 * - Popular search queries (from analytics)
 *
 * Run periodically (daily cron) to keep suggestions fresh.
 *
 * Usage:
 *   node scripts/search/populate-suggestions.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  console.log('🔍 Populating search suggestions...\n')

  const suggestions = new Map() // term → { frequency, source }

  // ─── Source 1: Category names ──────────────────────────────
  console.log('  📂 Extracting category names...')
  const { data: categories } = await supabase.rpc('get_fatwa_category_counts')

  if (categories) {
    for (const row of categories) {
      if (row.category_1) {
        const key = row.category_1.trim()
        const existing = suggestions.get(key)
        suggestions.set(key, {
          frequency: (existing?.frequency || 0) + Number(row.count),
          source: 'category',
        })
      }
      if (row.category_2) {
        const key = row.category_2.trim()
        const existing = suggestions.get(key)
        suggestions.set(key, {
          frequency: (existing?.frequency || 0) + Number(row.count),
          source: 'category',
        })
      }
      if (row.category_3) {
        const key = row.category_3.trim()
        const existing = suggestions.get(key)
        suggestions.set(key, {
          frequency: (existing?.frequency || 0) + Number(row.count),
          source: 'category',
        })
      }
    }
  }
  console.log(`    → ${suggestions.size} category terms`)

  // ─── Source 2: Fatwa titles (top terms by frequency) ───────
  console.log('  📝 Extracting title terms...')
  let titleOffset = 0
  const titleTerms = new Map()

  while (titleOffset < 10000) {
    const { data: fatwas } = await supabase
      .from('fatwas')
      .select('title')
      .not('title', 'is', null)
      .range(titleOffset, titleOffset + 999)

    if (!fatwas || fatwas.length === 0) break

    for (const f of fatwas) {
      if (!f.title || f.title.length < 5) continue
      // Use the full title as a suggestion (truncated to 100 chars)
      const term = f.title.trim().slice(0, 100)
      titleTerms.set(term, (titleTerms.get(term) || 0) + 1)
    }

    titleOffset += 1000
  }

  // Keep top 2000 title suggestions by frequency
  const sortedTitles = [...titleTerms.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2000)

  for (const [term, freq] of sortedTitles) {
    if (!suggestions.has(term)) {
      suggestions.set(term, { frequency: freq, source: 'title' })
    }
  }
  console.log(`    → ${sortedTitles.length} title terms added`)

  // ─── Source 3: Popular search queries (from analytics) ─────
  console.log('  📊 Extracting popular queries...')
  const { data: popularQueries } = await supabase
    .from('search_queries')
    .select('query')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(5000)

  if (popularQueries) {
    const queryCounts = new Map()
    for (const row of popularQueries) {
      const q = row.query.trim()
      if (q.length >= 2) {
        queryCounts.set(q, (queryCounts.get(q) || 0) + 1)
      }
    }

    const topQueries = [...queryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 500)

    for (const [term, freq] of topQueries) {
      if (!suggestions.has(term)) {
        suggestions.set(term, { frequency: freq, source: 'popular' })
      }
    }
    console.log(`    → ${topQueries.length} popular queries added`)
  }

  // ─── Upsert all suggestions ────────────────────────────────
  console.log(`\n  💾 Upserting ${suggestions.size} suggestions...`)

  const records = [...suggestions.entries()]
    .filter(([term]) => term && term.length >= 2 && term.length <= 200)
    .map(([term, { frequency, source }]) => ({
      term,
      frequency,
      source,
      updated_at: new Date().toISOString(),
    }))

  // Upsert in batches of 500
  for (let i = 0; i < records.length; i += 500) {
    const batch = records.slice(i, i + 500)
    const { error } = await supabase
      .from('search_suggestions')
      .upsert(batch, { onConflict: 'term' })

    if (error) {
      console.error(`    ❌ Upsert error at batch ${i}: ${error.message}`)
    }
  }

  console.log(`\n🎉 Done! ${records.length} suggestions populated.`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
