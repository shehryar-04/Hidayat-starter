import { useState } from 'react'
import { ScholarSearch } from './ScholarSearch'
import { ScholarProfile } from './ScholarProfile'
import { ScholarForm } from './ScholarForm'
import { Tabs, PageWrapper, PageHeader } from '../../shared/ui'

export default function ScholarAdminModule() {
  const [selectedScholar, setSelectedScholar] = useState(null)
  const [view, setView] = useState('search')

  const tabItems = [
    {
      label: 'Search & Manage',
      content: <ScholarSearch onSelectScholar={s => { setSelectedScholar(s); setView('profile') }} />,
    },
    {
      label: 'Add Scholar',
      content: <ScholarForm onComplete={() => setView('search')} />,
    },
  ]

  return (
    <PageWrapper>
      <PageHeader title="Scholar & Teacher Management" subtitle="Manage faculty profiles and assignments" />
      {view === 'profile' && selectedScholar ? (
        <ScholarProfile
          scholar={selectedScholar}
          onBack={() => { setSelectedScholar(null); setView('search') }}
          onDeactivate={() => { setSelectedScholar(null); setView('search') }}
        />
      ) : (
        <Tabs items={tabItems} />
      )}
    </PageWrapper>
  )
}
