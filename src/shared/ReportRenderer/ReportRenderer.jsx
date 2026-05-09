import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * ReportRenderer component
 * 
 * Fetches a ReportSchema from the report_schemas table, calls the designated
 * Edge Function for data, and renders the result in table, PDF, or CSV format.
 * 
 * Props:
 *   - reportKey: string - The unique key to fetch the report schema
 *   - onError: (error) => void - Optional callback for error handling
 */
export function ReportRenderer({ reportKey, onError }) {
  const [schema, setSchema] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState('table')

  // Fetch report schema and data
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch the report schema
        const { data: schemaData, error: schemaError } = await supabase
          .from('report_schemas')
          .select('*')
          .eq('report_key', reportKey)
          .single()

        if (schemaError) throw schemaError
        if (!schemaData) throw new Error('Report schema not found')

        setSchema(schemaData)

        // Call the Edge Function to get data
        const { data: reportData, error: reportError } = await supabase.functions.invoke(
          schemaData.schema.query_function,
          {
            body: {},
          }
        )

        if (reportError) throw reportError

        setData(reportData || [])
      } catch (err) {
        const errorMsg = err.message || 'Failed to load report'
        setError(errorMsg)
        onError?.(err)
      } finally {
        setLoading(false)
      }
    }

    if (reportKey) {
      fetchReport()
    }
  }, [reportKey, onError])

  // Export to CSV
  const exportToCSV = () => {
    if (!schema || !data) return

    const columns = schema.schema.columns
    const headers = columns.map(col => col.label).join(',')
    const rows = data.map(row =>
      columns.map(col => {
        const value = row[col.key]
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${schema.schema.title || 'report'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export to PDF (basic implementation)
  const exportToPDF = () => {
    if (!schema || !data) return

    // Create a simple PDF-like document using HTML
    const columns = schema.schema.columns
    const html = `
      <html>
        <head>
          <title>${schema.schema.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>${schema.schema.title}</h1>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${columns.map(col => `<td>${row[col.key] ?? ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${schema.schema.title || 'report'}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="report-renderer loading">Loading report...</div>
  }

  if (error) {
    return <div className="report-renderer error">Error: {error}</div>
  }

  if (!schema) {
    return <div className="report-renderer error">Report schema not found</div>
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="report-renderer empty-state">
        <p>{schema.schema.empty_state_message || 'No data available'}</p>
      </div>
    )
  }

  const columns = schema.schema.columns
  const exportFormats = schema.schema.export_formats || ['table']

  return (
    <div className="report-renderer">
      <div className="report-header">
        <h2>{schema.schema.title}</h2>
        <div className="export-controls">
          {exportFormats.includes('csv') && (
            <button onClick={exportToCSV} className="export-btn csv-btn">
              Export CSV
            </button>
          )}
          {exportFormats.includes('pdf') && (
            <button onClick={exportToPDF} className="export-btn pdf-btn">
              Export PDF
            </button>
          )}
        </div>
      </div>

      {exportFormats.includes('table') && (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key}>{row[col.key] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
