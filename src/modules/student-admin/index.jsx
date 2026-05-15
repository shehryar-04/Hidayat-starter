import { useState } from 'react'
import { StudentSearch } from './StudentSearch'
import { StudentProfile } from './StudentProfile'
import { BulkStudentUpdate } from './BulkStudentUpdate'
import { Tabs, PageWrapper, PageHeader } from '../../shared/ui'

export default function StudentAdminModule() {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [view, setView] = useState('search')

  const tabItems = [
    {
      label: 'Search & Manage',
      content: <StudentSearch onSelectStudent={s => { setSelectedStudent(s); setView('profile') }} />,
    },
    {
      label: 'Bulk Operations',
      content: <BulkStudentUpdate onComplete={() => setView('search')} />,
    },
  ]

  return (
    <PageWrapper>
      <PageHeader title="Student Administration" subtitle="Manage student records and enrollments" />
      {view === 'profile' && selectedStudent ? (
        <StudentProfile
          student={selectedStudent}
          onBack={() => { setSelectedStudent(null); setView('search') }}
          onStatusChange={() => {}}
        />
      ) : (
        <Tabs items={tabItems} />
      )}
    </PageWrapper>
  )
}
