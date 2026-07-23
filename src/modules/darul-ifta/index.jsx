import { useState } from 'react'
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom'
import { useRole } from '../../app/RoleProvider'
import { FatwaList } from './FatwaList'
import { FatwaEditor } from './FatwaEditor'
import { QuestionSubmitForm } from './QuestionSubmitForm'
import { WhatsAppButton } from '../../shared/WhatsAppButton'
import { Star, PenLine, BookOpen, BadgeCheck, Search, BarChart3, Shield, FileText } from 'lucide-react'
import { Card, CardContent, Tabs, cn } from '../../shared/ui'
import FatwaPlatformModule from '../fatwa-platform'

// ─── Hero Section (shared by all views) ──────────────────────
function DarulIftaHero({ showSubmitBtn = false, onSubmitClick }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/darul-ifta/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

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

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto md:mx-0 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 70,000+ fatwas..."
                className="w-full h-14 pl-12 pr-28 rounded-xl border-0 bg-white text-gray-900 placeholder-gray-400 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                aria-label="Search fatwas"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors min-h-[44px]"
              >
                Search
              </button>
            </div>
          </form>

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
              <Star className="w-5 h-5" />
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
    { Icon: PenLine, title: '1. Inquiry Submission', desc: 'Submit your question with full context. Our team ensures complete confidentiality for every seeker of guidance.' },
    { Icon: BookOpen, title: '2. Juridical Review', desc: 'Muftis analyze the question through the lens of Quran, Sunnah, and classical Fiqh principles (Madahib).' },
    { Icon: BadgeCheck, title: '3. Final Vetting', desc: 'The response is verified by a senior scholarly committee before being dispatched to you.' },
  ]
  return (
    <section className="max-w-screen-xl mx-auto px-8 py-24">
      <h2 className="font-display text-3xl font-bold text-primary-600 mb-12 text-center">The Scholarly Vetting Process</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map(({ Icon, title, desc }) => (
          <Card key={title} interactive>
            <CardContent className="p-8">
              <Icon className="w-9 h-9 text-primary-500 mb-4" />
              <h3 className="font-display text-xl font-bold text-primary-600 mb-3">{title}</h3>
              <p className="text-neutral-600 text-sm">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ─── Admin / Mufti: UNIFIED view (browse + manage + analytics) ──
function AdminMuftiView() {
  const [tab, setTab] = useState('browse')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // If on a sub-route (category, fatwa detail, search), show the platform directly
  const isSubRoute = pathname !== '/darul-ifta' && pathname !== '/darul-ifta/'

  if (isSubRoute) {
    return (
      <div className="bg-background min-h-screen">
        {/* Admin toolbar on sub-pages */}
        <AdminToolbar currentTab={tab} onTabChange={setTab} navigate={navigate} />
        <FatwaPlatformModule />
      </div>
    )
  }

  const tabs = [
    { key: 'browse', label: 'Browse & Search', icon: Search },
    { key: 'manage', label: 'Manage Fatwas', icon: FileText },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'moderation', label: 'Moderation', icon: Shield },
  ]

  return (
    <div className="bg-background min-h-screen">
      {/* Hero — same as public */}
      <DarulIftaHero showSubmitBtn onSubmitClick={() => setShowForm(true)} />

      {/* Admin tab bar */}
      <div className="sticky top-[57px] sm:top-[65px] z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
          <div className="flex gap-1 overflow-x-auto py-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                  tab === key
                    ? 'text-primary-500 font-semibold border-primary-500'
                    : 'text-neutral-500 hover:text-neutral-800 border-transparent'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'browse' && (
        <>
          <ProcessSteps />
          <div id="library">
            <FatwaPlatformModule />
          </div>
        </>
      )}

      {tab === 'manage' && (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-6">
          {selected ? (
            <FatwaEditor
              fatwa={selected}
              onComplete={() => { setSelected(null) }}
              onCancel={() => { setSelected(null) }}
            />
          ) : (
            <Tabs items={[
              { label: 'All Fatwas', content: <FatwaList onEdit={q => setSelected(q)} canManage /> },
              { label: '+ New Fatwa', content: <FatwaEditor onComplete={() => {}} onCancel={() => {}} /> },
            ]} />
          )}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-6">
          <AnalyticsEmbed />
        </div>
      )}

      {tab === 'moderation' && (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-6">
          <ModerationEmbed />
        </div>
      )}

      {/* Question form overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <QuestionSubmitForm onComplete={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* WhatsApp */}
      <div className="fixed bottom-6 right-6 z-50">
        <WhatsAppButton
          message="Assalamu Alaikum, I have a question for Darul Ifta."
          label="Ask on WhatsApp"
        />
      </div>
    </div>
  )
}

/**
 * Compact admin toolbar shown on sub-pages (category, detail, search).
 * Provides quick-links back to analytics/moderation without losing context.
 */
function AdminToolbar({ currentTab, onTabChange, navigate }) {
  return (
    <div className="bg-primary-50 border-b border-primary-100 px-4 py-2">
      <div className="max-w-screen-xl mx-auto flex items-center gap-3 text-xs">
        <span className="text-primary-600 font-medium">Admin:</span>
        <button onClick={() => navigate('/darul-ifta')} className="text-primary-500 hover:text-primary-700 underline-offset-2 hover:underline">
          Dashboard
        </button>
        <button onClick={() => navigate('/fatwas/analytics')} className="text-primary-500 hover:text-primary-700 underline-offset-2 hover:underline">
          Analytics
        </button>
        <button onClick={() => navigate('/fatwas/moderation')} className="text-primary-500 hover:text-primary-700 underline-offset-2 hover:underline">
          Moderation
        </button>
        <button onClick={() => navigate('/fatwas/import')} className="text-primary-500 hover:text-primary-700 underline-offset-2 hover:underline">
          Bulk Import
        </button>
      </div>
    </div>
  )
}

/**
 * Embed the SearchAnalytics page inline (lazy import to avoid circular deps).
 */
function AnalyticsEmbed() {
  const [Component, setComponent] = useState(null)

  if (!Component) {
    import('../fatwa-platform/pages/SearchAnalytics').then(mod => {
      setComponent(() => mod.default)
    })
    return <div className="py-12 text-center text-gray-400 text-sm">Loading analytics...</div>
  }

  return <Component />
}

/**
 * Embed the ModerationQueue page inline.
 */
function ModerationEmbed() {
  const [Component, setComponent] = useState(null)

  if (!Component) {
    import('../fatwa-platform/pages/ModerationQueue').then(mod => {
      setComponent(() => mod.default)
    })
    return <div className="py-12 text-center text-gray-400 text-sm">Loading moderation queue...</div>
  }

  return <Component />
}

// ─── Public View: Hero + Process + Fatwa Platform ────────────
function PublicView({ showSubmitBtn = false, onSubmitClick }) {
  const { pathname } = useLocation()

  // If on a sub-route, show only the platform
  const isSubRoute = pathname !== '/darul-ifta' && pathname !== '/darul-ifta/'

  if (isSubRoute) {
    return (
      <div className="bg-background min-h-screen">
        <FatwaPlatformModule />
        <div className="fixed bottom-6 right-6 z-50">
          <WhatsAppButton
            message="Assalamu Alaikum, I have a question for Darul Ifta."
            label="Ask on WhatsApp"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <DarulIftaHero showSubmitBtn={showSubmitBtn} onSubmitClick={onSubmitClick} />
      <ProcessSteps />
      <div id="library">
        <FatwaPlatformModule />
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <WhatsAppButton
          message="Assalamu Alaikum, I have a question for Darul Ifta."
          label="Ask on WhatsApp"
        />
      </div>
    </div>
  )
}

// ─── Scholar / Student: browse + submit question ─────────────
function ScholarStudentView() {
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return (
      <div className="bg-background min-h-screen">
        <QuestionSubmitForm onComplete={() => setShowForm(false)} />
      </div>
    )
  }

  return <PublicView showSubmitBtn onSubmitClick={() => setShowForm(true)} />
}

// ─── Guest: browse only, prompt to login to submit ───────────
function GuestView() {
  const navigate = useNavigate()
  return <PublicView showSubmitBtn onSubmitClick={() => navigate('/login')} />
}

// ─── Root: branch by role ─────────────────────────────────────
export default function DarulIftaModule() {
  const { role } = useRole()
  if (role === 'admin' || role === 'mufti') return <AdminMuftiView />
  if (role === 'scholar' || role === 'student') return <ScholarStudentView />
  return <GuestView />
}
