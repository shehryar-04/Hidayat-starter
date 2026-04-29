import { useState } from 'react'
import { PublicationSubmissionForm } from './PublicationSubmissionForm'
import { PublicationRepository } from './PublicationRepository'
import { ApprovalQueue } from './ApprovalQueue'

export default function ResearchCenterModule() {
  const [view, setView] = useState('repository')
  const tabs = [['repository', 'Repository'], ['submit', 'Submit Publication'], ['approval', 'Approval Queue']]

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-0">
        <h1 className="text-xl font-bold text-primary mb-4">Research Center</h1>
        <div className="tab-bar">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setView(key)} className={`tab ${view === key ? 'active' : ''}`}>{label}</button>
          ))}
        </div>
      </div>
      {view === 'repository' && <PublicationRepository />}
      {view === 'submit' && <PublicationSubmissionForm onComplete={() => setView('repository')} />}
      {view === 'approval' && <ApprovalQueue />}
    </div>
  )
}
