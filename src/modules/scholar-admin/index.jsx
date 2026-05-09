import { useState } from 'react'
import { ScholarSearch } from './ScholarSearch'
import { ScholarProfile } from './ScholarProfile'
import { ScholarForm } from './ScholarForm'

export default function ScholarAdminModule() {
  const [view, setView] = useState('search')
  const [selectedScholar, setSelectedScholar] = useState(null)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-0">
        <h1 className="text-xl font-bold text-primary mb-4">Scholar & Teacher Management</h1>
        <div className="tab-bar">
          {[['search', 'Search & Manage'], ['create', 'Add Scholar']].map(([key, label]) => (
            <button key={key} onClick={() => { setView(key); setSelectedScholar(null) }} className={`tab ${view === key ? 'active' : ''}`}>{label}</button>
          ))}
        </div>
      </div>
      {view === 'search' && !selectedScholar && <ScholarSearch onSelectScholar={s => { setSelectedScholar(s); setView('profile') }} />}
      {view === 'profile' && selectedScholar && <ScholarProfile scholar={selectedScholar} onBack={() => { setSelectedScholar(null); setView('search') }} onDeactivate={() => { setSelectedScholar(null); setView('search') }} />}
      {view === 'create' && <ScholarForm onComplete={() => setView('search')} />}
    </div>
  )
}
