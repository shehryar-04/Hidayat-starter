import { useState } from 'react'
import { useRole } from '../../app/RoleProvider'
import { PublicationSubmissionForm } from './PublicationSubmissionForm'
import { PublicationRepository } from './PublicationRepository'
import { ApprovalQueue } from './ApprovalQueue'

export default function ResearchCenterModule() {
  const { role } = useRole()
  const isAdmin = role === 'admin'
  const isScholar = role === 'scholar' || role === 'mufti'

  const [view, setView] = useState('repository')

  // Build tabs based on role
  const tabs = [['repository', 'Publications']]
  if (isAdmin || isScholar) tabs.push(['submit', 'Submit Publication'])
  if (isAdmin) tabs.push(['approval', 'Approval Queue'])

  return (
    <div>
      {/* Tab bar */}
      <div className="bg-white border-b border-outline px-6 md:px-8 pt-6 pb-0">
        <h1 className="text-headline-md font-serif text-primary mb-1">Darul Aarifeen Research Center</h1>
        <p className="text-sm text-gray-500 mb-4">Peer-reviewed journals, monographs, and academic publications</p>
        <div className="tab-bar">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`tab ${view === key ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {view === 'repository' && <PublicationRepository />}
        {view === 'submit' && (isAdmin || isScholar) && (
          <PublicationSubmissionForm onComplete={() => setView('repository')} />
        )}
        {view === 'approval' && isAdmin && <ApprovalQueue />}
      </div>
    </div>
  )
}
