import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../app/RoleProvider'
import { FatwaList } from './FatwaList'
import { FatwaEditor } from './FatwaEditor'
import { PublicFatwaList } from './PublicFatwaList'
import { QuestionSubmitForm } from './QuestionSubmitForm'

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

// ─── Hero Section (shared by guest + scholar/student) ────────
function DarulIftaHero({ showSubmitBtn = false, onSubmitClick }) {
  return (
    <header className="relative py-24 overflow-hidden bg-primary text-white">
      <div className="absolute inset-0 pattern-overlay opacity-20" />
      <div className="max-w-screen-xl mx-auto px-8 relative z-10 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block px-4 py-1 rounded-full bg-secondary/20 text-secondary font-bold text-sm mb-6 border border-secondary/30">
            Department of Islamic Jurisprudence
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Darul Ifta</h1>
          <p className="text-lg text-white/80 max-w-2xl mb-8">
            Guided by classical scholarship and contemporary precision. Our Muftis provide scholarly vetting for every inquiry, ensuring spiritual clarity for the modern era.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            {showSubmitBtn && onSubmitClick && (
              <button onClick={onSubmitClick}
                className="bg-secondary text-primary-900 px-8 py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-secondary/20 transition-all">
                Submit a Request
              </button>
            )}
            <a href="#library" className="border border-secondary text-secondary px-8 py-3 rounded-lg font-bold hover:bg-secondary/10 transition-all">
              Browse Library
            </a>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-80 h-80 rounded-3xl bg-primary-700 border border-secondary/30 flex items-center justify-center p-8 backdrop-blur-sm shadow-2xl relative">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary-900">
              <Icon name="star" />
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4 text-secondary font-serif">دار الإفتاء</div>
              <div className="h-1 w-12 bg-secondary mx-auto mb-6" />
              <p className="font-serif italic text-white/90 text-lg">"Seeking knowledge is an obligation upon every Muslim"</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Process Steps ───────────────────────────────────────────
function ProcessSteps() {
  const steps = [
    { icon: 'edit_note', title: '1. Inquiry Submission', desc: 'Submit your question with full context. Our team ensures complete confidentiality for every seeker of guidance.' },
    { icon: 'menu_book', title: '2. Juridical Review', desc: 'Muftis analyze the question through the lens of Quran, Sunnah, and classical Fiqh principles (Madahib).' },
    { icon: 'verified', title: '3. Final Vetting', desc: 'The response is verified by a senior scholarly committee before being dispatched to you.' },
  ]
  return (
    <section className="max-w-screen-xl mx-auto px-8 py-24">
      <h2 className="font-serif text-3xl font-bold text-primary mb-12 text-center">The Scholarly Vetting Process</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map(({ icon, title, desc }) => (
          <div key={title} className="bg-white p-8 rounded-2xl shadow-sm border border-outline hover:border-secondary transition-all">
            <Icon name={icon} className="text-primary text-4xl mb-4" />
            <h3 className="font-serif text-xl font-bold text-primary mb-3">{title}</h3>
            <p className="text-slate-600 text-body-md">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Admin / Mufti: full management ──────────────────────────
function AdminMuftiView() {
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-white border-b border-outline px-8 pt-6 pb-0">
        <h1 className="font-serif text-xl font-bold text-primary mb-4">Darul Ifta — Fatwa Management</h1>
        <div className="tab-bar">
          {[['list', 'All Fatwas'], ['create', '+ New Fatwa']].map(([key, label]) => (
            <button key={key}
              onClick={() => { setView(key); setSelected(null) }}
              className={`tab ${view === key || (view === 'edit' && key === 'list') ? 'active' : ''}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === 'list' && !selected && <FatwaList onEdit={q => { setSelected(q); setView('edit') }} canManage />}
      {view === 'create' && <FatwaEditor onComplete={() => setView('list')} onCancel={() => setView('list')} />}
      {view === 'edit' && selected && (
        <FatwaEditor fatwa={selected}
          onComplete={() => { setSelected(null); setView('list') }}
          onCancel={() => { setSelected(null); setView('list') }} />
      )}
    </div>
  )
}

// ─── Scholar / Student: browse + submit question ──────────────
function ScholarStudentView() {
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return (
      <div className="bg-background min-h-screen">
        <QuestionSubmitForm onComplete={() => setShowForm(false)} />
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <DarulIftaHero showSubmitBtn onSubmitClick={() => setShowForm(true)} />
      <ProcessSteps />
      <div id="library" className="max-w-screen-xl mx-auto px-8 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-3xl font-bold text-primary">Fatwa Library</h2>
        </div>
        <PublicFatwaList hideHeader />
      </div>
    </div>
  )
}

// ─── Guest: browse only, prompt to login to submit ───────────
function GuestView() {
  const navigate = useNavigate()
  return (
    <div className="bg-background min-h-screen">
      <DarulIftaHero showSubmitBtn onSubmitClick={() => navigate('/login')} />
      <ProcessSteps />
      <div id="library" className="max-w-screen-xl mx-auto px-8 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-3xl font-bold text-primary">Fatwa Library</h2>
          <p className="text-sm text-slate-500">
            <a href="/login" className="text-primary underline hover:text-secondary">Sign in</a> to submit your own question.
          </p>
        </div>
        <PublicFatwaList hideHeader />
      </div>
    </div>
  )
}

// ─── Root: branch by role ─────────────────────────────────────
export default function DarulIftaModule() {
  const { role } = useRole()
  if (role === 'admin' || role === 'mufti') return <AdminMuftiView />
  if (role === 'scholar' || role === 'student') return <ScholarStudentView />
  return <GuestView />
}
