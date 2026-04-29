import { useState } from 'react'
import { EligibilityEvaluation } from './EligibilityEvaluation'
import { DisbursementReport } from './DisbursementReport'

export default function WazifaModule() {
  const [view, setView] = useState('evaluation')
  const tabs = [['evaluation', 'Eligibility Evaluation'], ['report', 'Disbursement Report']]

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-0">
        <h1 className="text-xl font-bold text-primary mb-4">Wazifa — Stipend Management</h1>
        <div className="tab-bar">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setView(key)} className={`tab ${view === key ? 'active' : ''}`}>{label}</button>
          ))}
        </div>
      </div>
      {view === 'evaluation' && <EligibilityEvaluation />}
      {view === 'report' && <DisbursementReport />}
    </div>
  )
}
