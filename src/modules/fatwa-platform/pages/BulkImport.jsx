import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2, Play, AlertTriangle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Button, Badge, Spinner, Card, CardContent, EmptyState, PageWrapper, PageHeader } from '../../../shared/ui'

/**
 * BulkImport — Admin tool for importing fatwas from CSV/JSON.
 * Pipeline: Upload → Parse → Stage → Validate → Publish
 */
export default function BulkImport() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [validating, setValidating] = useState(null)
  const [publishing, setPublishing] = useState(null)
  const [stagedRows, setStagedRows] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const fileInputRef = useRef(null)

  const loadBatches = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('import_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    setBatches(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadBatches() }, [loadBatches])

  const loadStagedRows = async (batchId) => {
    setSelectedBatch(batchId)
    const { data } = await supabase
      .from('import_staged_fatwas')
      .select('*')
      .eq('batch_id', batchId)
      .order('row_number')
      .limit(100)

    setStagedRows(data || [])
  }

  // Parse CSV content into rows
  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      // Simple CSV parsing (handles basic quoting)
      const values = []
      let current = ''
      let inQuotes = false

      for (const char of lines[i]) {
        if (char === '"') { inQuotes = !inQuotes; continue }
        if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
        current += char
      }
      values.push(current.trim())

      const row = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || null })
      rows.push(row)
    }
    return rows
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()

    try {
      const text = await file.text()
      let rows = []

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text)
        rows = Array.isArray(parsed) ? parsed : [parsed]
      } else {
        rows = parseCSV(text)
      }

      if (rows.length === 0) {
        alert('No valid rows found in file.')
        setUploading(false)
        return
      }

      // Create batch
      const { data: batch, error: batchErr } = await supabase
        .from('import_batches')
        .insert({
          name: file.name,
          source_type: file.name.endsWith('.json') ? 'json' : 'csv',
          total_rows: rows.length,
          imported_by: user.id,
        })
        .select('id')
        .single()

      if (batchErr) throw batchErr

      // Stage rows in chunks of 50
      const chunkSize = 50
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize).map((row, idx) => ({
          batch_id: batch.id,
          row_number: i + idx + 1,
          title: row.title || null,
          question: row.question || null,
          answer: row.answer || null,
          fatwa_ref: row.fatwa_ref || row.reference || null,
          category_1: row.category_1 || null,
          category_2: row.category_2 || null,
          category_3: row.category_3 || null,
          dar_ul_ifta: row.dar_ul_ifta || row.institution || null,
          slug: row.slug || null,
        }))

        await supabase.from('import_staged_fatwas').insert(chunk)
      }

      loadBatches()
    } catch (err) {
      console.error('Import error:', err)
      alert('Failed to import file. Check the format and try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleValidate = async (batchId) => {
    setValidating(batchId)
    const { data, error } = await supabase.rpc('validate_import_batch', { p_batch_id: batchId })
    if (error) console.error('Validation error:', error)
    setValidating(null)
    loadBatches()
    if (selectedBatch === batchId) loadStagedRows(batchId)
  }

  const handlePublish = async (batchId) => {
    if (!confirm('Publish all valid rows in this batch? This will create new fatwa entries.')) return

    setPublishing(batchId)

    // Get valid rows
    const { data: validRows } = await supabase
      .from('import_staged_fatwas')
      .select('*')
      .eq('batch_id', batchId)
      .eq('is_valid', true)
      .eq('is_published', false)

    if (!validRows || validRows.length === 0) {
      alert('No valid unpublished rows to publish.')
      setPublishing(null)
      return
    }

    // Insert into fatwas table
    let publishedCount = 0
    for (const row of validRows) {
      const { data: fatwa, error: insertErr } = await supabase
        .from('fatwas')
        .insert({
          title: row.title,
          question: row.question,
          answer: row.answer,
          fatwa_ref: row.fatwa_ref,
          category_1: row.category_1,
          category_2: row.category_2,
          category_3: row.category_3,
          dar_ul_ifta: row.dar_ul_ifta,
          slug: row.slug,
        })
        .select('id')
        .single()

      if (!insertErr && fatwa) {
        await supabase
          .from('import_staged_fatwas')
          .update({ is_published: true, published_fatwa_id: fatwa.id })
          .eq('id', row.id)
        publishedCount++
      }
    }

    // Update batch
    await supabase
      .from('import_batches')
      .update({
        status: 'published',
        published_rows: publishedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    setPublishing(null)
    loadBatches()
    if (selectedBatch === batchId) loadStagedRows(batchId)
  }

  const statusColors = {
    staged: 'bg-gray-100 text-gray-700',
    validating: 'bg-blue-100 text-blue-700',
    validated: 'bg-yellow-100 text-yellow-700',
    publishing: 'bg-purple-100 text-purple-700',
    published: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Bulk Import"
        description="Import fatwas from CSV or JSON files with validation."
        icon={<Upload className="text-primary" />}
      />

      {/* Upload area */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                Upload a CSV or JSON file. Required columns: <code className="text-xs bg-gray-100 px-1 rounded">title</code>, <code className="text-xs bg-gray-100 px-1 rounded">question</code>, <code className="text-xs bg-gray-100 px-1 rounded">answer</code>.
                Optional: <code className="text-xs bg-gray-100 px-1 rounded">fatwa_ref</code>, <code className="text-xs bg-gray-100 px-1 rounded">category_1/2/3</code>, <code className="text-xs bg-gray-100 px-1 rounded">dar_ul_ifta</code>, <code className="text-xs bg-gray-100 px-1 rounded">slug</code>.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
            {uploading && <Spinner size="sm" />}
          </div>
        </CardContent>
      </Card>

      {/* Batches list */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : batches.length === 0 ? (
        <EmptyState
          title="No imports yet"
          description="Upload a CSV or JSON file to get started."
        />
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <Card key={batch.id} className={selectedBatch === batch.id ? 'ring-2 ring-primary/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{batch.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[batch.status]}`}>
                          {batch.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {batch.total_rows} rows
                          {batch.valid_rows > 0 && ` • ${batch.valid_rows} valid`}
                          {batch.invalid_rows > 0 && ` • ${batch.invalid_rows} invalid`}
                          {batch.published_rows > 0 && ` • ${batch.published_rows} published`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadStagedRows(batch.id)}
                    >
                      View Rows
                    </Button>
                    {(batch.status === 'staged' || batch.status === 'validated') && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={validating === batch.id}
                        onClick={() => handleValidate(batch.id)}
                      >
                        {validating === batch.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <CheckCircle size={14} className="mr-1" />}
                        Validate
                      </Button>
                    )}
                    {batch.status === 'validated' && batch.valid_rows > 0 && (
                      <Button
                        size="sm"
                        disabled={publishing === batch.id}
                        onClick={() => handlePublish(batch.id)}
                      >
                        {publishing === batch.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <Play size={14} className="mr-1" />}
                        Publish ({batch.valid_rows})
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Staged rows detail */}
      {selectedBatch && stagedRows.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Staged Rows (showing first 100)
          </h3>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Title</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Slug</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Valid</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stagedRows.map((row) => (
                  <tr key={row.id} className={row.is_valid === false ? 'bg-red-50/50' : ''}>
                    <td className="px-3 py-2 text-gray-400">{row.row_number}</td>
                    <td className="px-3 py-2 text-gray-800 max-w-[200px] truncate">{row.title}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[150px] truncate">
                      {[row.category_1, row.category_2].filter(Boolean).join(' > ')}
                    </td>
                    <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate font-mono">{row.slug || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      {row.is_valid === true && <CheckCircle size={14} className="text-green-500 mx-auto" />}
                      {row.is_valid === false && <XCircle size={14} className="text-red-500 mx-auto" />}
                      {row.is_valid === null && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-red-600 max-w-[200px]">
                      {row.validation_errors && Array.isArray(row.validation_errors) && row.validation_errors.length > 0 && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={12} />
                          {row.validation_errors.join('; ')}
                        </span>
                      )}
                      {row.is_published && <Badge className="text-xs bg-green-100 text-green-700">Published</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
