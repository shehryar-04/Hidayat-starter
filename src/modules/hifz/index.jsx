import { useState } from 'react'
import { HifzProgressGrid } from './HifzProgressGrid'
import { HifzStudentSearch } from './HifzStudentSearch'

export default function HifzModule() {
  const [selectedStudent, setSelectedStudent] = useState(null)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-4">
        <h1 className="text-xl font-bold text-primary">Hifz Program — Quran Memorization</h1>
      </div>
      {!selectedStudent
        ? <HifzStudentSearch onSelectStudent={setSelectedStudent} />
        : <HifzProgressGrid student={selectedStudent} onBack={() => setSelectedStudent(null)} />}
    </div>
  )
}
