import { useState } from 'react'
import { NazraProgressView } from './NazraProgressView'
import { NazraStudentSearch } from './NazraStudentSearch'

export default function NazraModule() {
  const [selectedStudent, setSelectedStudent] = useState(null)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-4">
        <h1 className="text-xl font-bold text-primary">Nazra Program — Quran Recitation</h1>
      </div>
      {!selectedStudent
        ? <NazraStudentSearch onSelectStudent={setSelectedStudent} />
        : <NazraProgressView student={selectedStudent} onBack={() => setSelectedStudent(null)} />}
    </div>
  )
}
