import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Disbursement Report Component
 * Displays wazifa disbursement report with eligible students and amounts
 * Requirements: 12.5
 */
export function DisbursementReport() {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filterEligible, setFilterEligible] = useState(true)
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    loadEvaluations()
  }, [filterEligible])

  const loadEvaluations = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('wazifa_evaluations')
        .select(
          `
          id,
          student_id,
          rule_version,
          eligible,
          stipend_amount,
          evaluated_at,
          students:student_id (
            id,
            enrollment_number,
            profile_id,
            profiles:profile_id (
              id,
              full_name
            )
          )
        `
        )

      if (filterEligible) {
        query = query.eq('eligible', true)
      }

      const { data, error: err } = await query.order('evaluated_at', {
        ascending: false,
      })

      if (err) throw err

      setEvaluations(data || [])

      // Calculate total amount
      const total = (data || []).reduce(
        (sum, record) => sum + (record.stipend_amount || 0),
        0
      )
      setTotalAmount(total)
    } catch (err) {
      setError(err.message)
      console.error('Error loading evaluations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const headers = [
      'Student Name',
      'Enrollment Number',
      'Eligible',
      'Stipend Amount',
      'Rule Version',
      'Evaluation Date',
    ]
    const rows = evaluations.map((record) => [
      record.students?.profiles?.full_name || 'Unknown',
      record.students?.enrollment_number || 'N/A',
      record.eligible ? 'Yes' : 'No',
      record.stipend_amount || '0',
      record.rule_version,
      new Date(record.evaluated_at).toLocaleDateString(),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wazifa_disbursement_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    // This would typically use a PDF library like jsPDF
    // For now, we'll just show a message
    alert('PDF export functionality would be implemented with a PDF library')
  }

  if (loading) {
    return <div className="loading">Loading disbursement report...</div>
  }

  return (
    <div className="disbursement-report">
      <h2>Wazifa Disbursement Report</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="report-controls">
        <div className="filter-section">
          <label htmlFor="filter-eligible">
            <input
              id="filter-eligible"
              type="checkbox"
              checked={filterEligible}
              onChange={(e) => setFilterEligible(e.target.checked)}
            />
            Show Only Eligible Students
          </label>
        </div>

        <div className="export-buttons">
          <button onClick={handleExportCSV} className="export-csv-button">
            Export as CSV
          </button>
          <button onClick={handleExportPDF} className="export-pdf-button">
            Export as PDF
          </button>
        </div>
      </div>

      <div className="report-summary">
        <div className="summary-card">
          <h3>Total Records</h3>
          <p className="amount">{evaluations.length}</p>
        </div>

        <div className="summary-card">
          <h3>Total Disbursement Amount</h3>
          <p className="amount">${totalAmount.toFixed(2)}</p>
        </div>

        {filterEligible && (
          <div className="summary-card">
            <h3>Average Stipend</h3>
            <p className="amount">
              $
              {evaluations.length > 0
                ? (totalAmount / evaluations.length).toFixed(2)
                : '0.00'}
            </p>
          </div>
        )}
      </div>

      <div className="report-table">
        {evaluations.length === 0 ? (
          <p>No records found</p>
        ) : (
          <table className="disbursement-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Enrollment Number</th>
                <th>Eligible</th>
                <th>Stipend Amount</th>
                <th>Rule Version</th>
                <th>Evaluation Date</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((record) => (
                <tr key={record.id}>
                  <td>{record.students?.profiles?.full_name || 'Unknown'}</td>
                  <td>{record.students?.enrollment_number || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${record.eligible ? 'eligible' : 'ineligible'}`}>
                      {record.eligible ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>${record.stipend_amount?.toFixed(2) || '0.00'}</td>
                  <td>{record.rule_version}</td>
                  <td>
                    {new Date(record.evaluated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3">
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>${totalAmount.toFixed(2)}</strong>
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
