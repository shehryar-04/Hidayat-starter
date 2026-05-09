import { useState } from 'react'
import { StudentSearch } from './StudentSearch'
import { StudentProfile } from './StudentProfile'
import { BulkStudentUpdate } from './BulkStudentUpdate'

export default function StudentAdminModule() {
  const [view, setView] = useState('search')
  const [selectedStudent, setSelectedStudent] = useState(null)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-0">
        <h1 className="text-xl font-bold text-primary mb-4">Student Administration</h1>
        <div className="tab-bar">
          {[['search', 'Search & Manage'], ['bulk', 'Bulk Operations']].map(([key, label]) => (
            <button key={key} onClick={() => { setView(key); setSelectedStudent(null) }}
              className={`tab ${view === key ? 'active' : ''}`}>{label}</button>
          ))}
        </div>
      </div>

      {view === 'search' && !selectedStudent && <StudentSearch onSelectStudent={s => { setSelectedStudent(s); setView('profile') }} />}
      {view === 'profile' && selectedStudent && <StudentProfile student={selectedStudent} onBack={() => { setSelectedStudent(null); setView('search') }} onStatusChange={() => {}} />}
      {view === 'bulk' && <BulkStudentUpdate onComplete={() => setView('search')} />}
    </div>
  )
}
