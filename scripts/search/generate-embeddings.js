/**
 * Hidayat Enterprise Search — Chunk-Based Embedding Pipeline
 *
 * Corrected architecture:
 * - Splits each fatwa into 400-800 word chunks
 * - Preserves category context inside each chunk
 * - Generates embeddings per chunk (NOT per fatwa)
 * - Stores in fatwa_chunks table with generic vector type
 * - Links back to parent fatwa_id
 *
 * Usage:
 *   node scripts/search/generate-embeddings.js [--mode=initial|incremental] [--batch-size=20]
 *
 * Prerequisites:
 *   - Embedding server running locally (e.g., TEI with BAAI/bge-m3)
 *   - Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EMBEDDING_API_URL
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMBEDDING_API_URL = process.env.EMBEDDING_API_URL || 'http://localhost:8080/embed'

// Chunk configuration (token-based, ~600-800 tokens per chunk)
// Approximation: 1 Urdu/Arabic word ≈ 2-3 tokens, 1 English word ≈ 1.3 tokens
// Using word count as proxy: 300-500 words ≈ 600-800 tokens
const MIN_CHUNK_WORDS = 300
const MAX_CHUNK_WORDS = 500
const OVERLAP_PERCENT = 0.12 // 10-15% overlap

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const args = process.argv.slice(2)
const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'incremental'
const batchSize = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '20', 10)

/**
 * Build the category path string for embedding context.
 */
function buildCategoryPath(fatwa) {
  return [fatwa.category_1, fatwa.category_2, fatwa.category_3]
    .filter(Boolean)
    .join(' > ')
}

/**
 * Split fatwa content into chunks using semantic boundaries.
 * Strategy:
 * 1. Split by paragraphs/headings FIRST (semantic boundaries)
 * 2. Merge small paragraphs until reaching target size
 * 3. Split oversized paragraphs at sentence boundaries
 * 4. Add 10-15% overlap between chunks
 * 5. Prefix each chunk with category_path context
 *
 * Target: 600-800 tokens per chunk (approximated via word count)
 */
function chunkFatwa(fatwa) {
  const categoryPath = buildCategoryPath(fatwa)
  const prefix = categoryPath ? `Category: ${categoryPath}\n` : ''

  // Combine question + answer
  const fullText = [
    fatwa.title ? `Title: ${fatwa.title}` : '',
    fatwa.question ? `Question: ${fatwa.question}` : '',
    fatwa.answer ? `Answer: ${fatwa.answer}` : '',
  ].filter(Boolean).join('\n\n')

  // Split by semantic boundaries (double newline, headings)
  const paragraphs = fullText
    .split(/\n{2,}|(?=^#{1,4}\s)/m)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  // If total content fits in one chunk, return single chunk
  const totalWords = fullText.split(/\s+/).filter(w => w.length > 0).length
  if (totalWords <= MAX_CHUNK_WORDS) {
    return [{ content: prefix + fullText, chunk_index: 0 }]
  }

  // Merge paragraphs into chunks respecting size limits
  const chunks = []
  let currentChunk = ''
  let currentWordCount = 0

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).filter(w => w.length > 0).length

    // If adding this paragraph exceeds max, finalize current chunk
    if (currentWordCount + paraWords > MAX_CHUNK_WORDS && currentWordCount >= MIN_CHUNK_WORDS) {
      chunks.push(currentChunk.trim())
      // Overlap: keep last ~12% of current chunk as start of next
      const overlapWords = Math.floor(currentWordCount * OVERLAP_PERCENT)
      const words = currentChunk.trim().split(/\s+/)
      currentChunk = words.slice(-overlapWords).join(' ') + '\n\n'
      currentWordCount = overlapWords
    }

    // If a single paragraph is too large, split at sentence boundaries
    if (paraWords > MAX_CHUNK_WORDS) {
      // Finalize current chunk first
      if (currentWordCount >= MIN_CHUNK_WORDS) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
        currentWordCount = 0
      }

      // Split large paragraph by sentences
      const sentences = para.split(/(?<=[۔؟!.?])\s+/)
      for (const sentence of sentences) {
        const sentWords = sentence.split(/\s+/).filter(w => w.length > 0).length
        if (currentWordCount + sentWords > MAX_CHUNK_WORDS && currentWordCount >= MIN_CHUNK_WORDS) {
          chunks.push(currentChunk.trim())
          const words = currentChunk.trim().split(/\s+/)
          const overlapWords = Math.floor(currentWordCount * OVERLAP_PERCENT)
          currentChunk = words.slice(-overlapWords).join(' ') + ' '
          currentWordCount = overlapWords
        }
        currentChunk += sentence + ' '
        currentWordCount += sentWords
      }
    } else {
      currentChunk += para + '\n\n'
      currentWordCount += paraWords
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  // Add prefix to each chunk and return with indices
  return chunks.map((content, i) => ({
    content: prefix + content,
    chunk_index: i,
  }))
}

/**
 * Call embedding API. Supports OpenAI-compatible and simple formats.
 */
async function generateEmbeddings(texts) {
  const response = await fetch(EMBEDDING_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: texts, model: 'BAAI/bge-m3' }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Embedding API error (${response.status}): ${error}`)
  }

  const data = await response.json()

  // OpenAI-compatible format
  if (data.data && Array.isArray(data.data)) {
    return data.data.map(d => d.embedding)
  }
  // Simple format
  if (data.embeddings && Array.isArray(data.embeddings)) {
    return data.embeddings
  }

  throw new Error('Unexpected embedding API response format')
}

/**
 * Main pipeline.
 */
async function main() {
  console.log(`\n🔍 Hidayat Chunk-Based Embedding Pipeline`)
  console.log(`   Mode: ${mode}`)
  console.log(`   Batch size: ${batchSize}`)
  console.log(`   Chunk size: ${MIN_CHUNK_WORDS}-${MAX_CHUNK_WORDS} words`)
  console.log(`   Overlap: ${OVERLAP_WORDS} words`)
  console.log(`   Embedding API: ${EMBEDDING_API_URL}\n`)

  const { count: totalFatwas } = await supabase
    .from('fatwas')
    .select('id', { count: 'exact', head: true })

  console.log(`📊 Total fatwas: ${totalFatwas}`)

  const { count: existingChunks } = await supabase
    .from('fatwa_chunks')
    .select('id', { count: 'exact', head: true })

  console.log(`📊 Existing chunks: ${existingChunks || 0}`)

  let offset = 0
  let processedFatwas = 0
  let totalChunks = 0
  let errors = 0
  const startTime = Date.now()

  while (true) {
    // Fetch batch of fatwas
    let query = supabase
      .from('fatwas')
      .select('id, title, question, answer, category_1, category_2, category_3')
      .order('created_at', { ascending: true })
      .range(offset, offset + batchSize - 1)

    const { data: batch, error: fetchError } = await query

    if (fetchError) {
      console.error(`❌ Fetch error: ${fetchError.message}`)
      break
    }

    if (!batch || batch.length === 0) break

    // For incremental mode, skip fatwas that already have chunks
    let toProcess = batch
    if (mode === 'incremental') {
      const ids = batch.map(f => f.id)
      const { data: existing } = await supabase
        .from('fatwa_chunks')
        .select('fatwa_id')
        .in('fatwa_id', ids)

      const existingIds = new Set((existing || []).map(e => e.fatwa_id))
      toProcess = batch.filter(f => !existingIds.has(f.id))
    }

    if (toProcess.length > 0) {
      try {
        await processBatch(toProcess)
        processedFatwas += toProcess.length
        totalChunks += toProcess.reduce((sum, f) => sum + chunkFatwa(f).length, 0)
      } catch (err) {
        console.error(`❌ Batch error: ${err.message}`)
        errors++
        if (errors > 10) {
          console.error('Too many errors, stopping.')
          break
        }
      }
    }

    offset += batchSize

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const rate = (processedFatwas / (parseFloat(elapsed) || 1)).toFixed(1)
    process.stdout.write(`\r   ✅ Fatwas: ${processedFatwas} | Chunks: ${totalChunks} | Rate: ${rate}/s | ${elapsed}s`)

    if (offset >= totalFatwas) break
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n\n🎉 Done! ${processedFatwas} fatwas → ${totalChunks} chunks in ${totalTime}s (${errors} errors)`)
}

/**
 * Process a batch: chunk → embed → store.
 */
async function processBatch(fatwas) {
  // Step 1: Generate chunks for all fatwas in batch
  const allChunks = []
  for (const fatwa of fatwas) {
    const chunks = chunkFatwa(fatwa)
    for (const chunk of chunks) {
      allChunks.push({
        fatwa_id: fatwa.id,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
      })
    }
  }

  // Step 2: Generate embeddings for all chunks
  const texts = allChunks.map(c => c.content)
  const embeddings = await generateEmbeddings(texts)

  if (embeddings.length !== allChunks.length) {
    throw new Error(`Embedding count mismatch: got ${embeddings.length}, expected ${allChunks.length}`)
  }

  // Step 3: Prepare records for upsert
  const records = allChunks.map((chunk, i) => ({
    fatwa_id: chunk.fatwa_id,
    chunk_index: chunk.chunk_index,
    content: chunk.content,
    embedding: `[${embeddings[i].join(',')}]`,
    updated_at: new Date().toISOString(),
  }))

  // Step 4: Upsert into fatwa_chunks
  const { error } = await supabase
    .from('fatwa_chunks')
    .upsert(records, { onConflict: 'fatwa_id,chunk_index' })

  if (error) {
    throw new Error(`Upsert error: ${error.message}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
