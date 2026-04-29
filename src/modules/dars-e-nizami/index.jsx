import { useState } from 'react'
import { CurriculumView } from './CurriculumView'
import { StudentEnrollmentView } from './StudentEnrollmentView'
import { EvaluationView } from './EvaluationView'
import { TranscriptView } from './TranscriptView'

export default function DarsENizamiModule() {
  const [view, setView] = useState('curriculum')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(null)

  const tabs = [
    ['curriculum', 'Curriculum'],
    ['enrollment', 'Enrollment'],
    ['evaluation', 'Evaluations'],
    ['transcript', 'Transcripts'],
  ]

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-0">
        <h1 className="text-xl font-bold text-primary mb-4">Dars-e-Nizami Program</h1>
        <div className="tab-bar">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setView(key)} className={`tab ${view === key ? 'active' : ''}`}>{label}</button>
          ))}
        </div>
      </div>
      <div>
        {view === 'curriculum' && <CurriculumView onSelectLevel={setSelectedLevel} />}
        {view === 'enrollment' && <StudentEnrollmentView selectedLevel={selectedLevel} onSelectStudent={setSelectedStudent} />}
        {view === 'evaluation' && <EvaluationView selectedStudent={selectedStudent} selectedLevel={selectedLevel} />}
        {view === 'transcript' && <TranscriptView selectedStudent={selectedStudent} />}
      </div>
    </div>
  )
}
