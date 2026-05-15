import { useState } from 'react'
import { useRole } from '../../app/RoleProvider'
import { PublicationSubmissionForm } from './PublicationSubmissionForm'
import { PublicationRepository } from './PublicationRepository'
import { ApprovalQueue } from './ApprovalQueue'
import { Tabs } from '../../shared/ui'

// ─── Hero Section ────────────────────────────────────────────
function ResearchCenterHero() {
  return (
    <header className="relative py-20 sm:py-24 overflow-hidden bg-primary text-white">
      <div className="absolute inset-0 pattern-overlay opacity-20" />
      <div className="max-w-screen-xl mx-auto px-6 sm:px-8 relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-12">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block px-4 py-1 rounded-full bg-secondary/20 text-secondary font-bold text-sm mb-6 border border-secondary/30">
            Academic Research & Publications
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Darul Aarifeen Research Center
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mb-8">
            Advancing Islamic scholarship through rigorous academic research, peer-reviewed publications, and the preservation of classical knowledge for future generations.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <a href="#publications" className="bg-secondary text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-secondary/20 transition-all">
              Browse Publications
            </a>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center p-6 backdrop-blur-sm shadow-2xl relative">
            <img
              src="/assets/darul-aarifeen-logo.jpeg"
              alt="Darul Aarifeen Research Center"
              className="w-full h-full rounded-2xl"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

export default function ResearchCenterModule() {
  const { role } = useRole()
  const isAdmin = role === 'admin'
  const isScholar = role === 'scholar' || role === 'mufti'

  // Build tabs based on role
  const tabItems = [{ label: 'Publications', content: <PublicationRepository /> }]
  if (isAdmin || isScholar) tabItems.push({ label: 'Submit Publication', content: <PublicationSubmissionForm onComplete={() => {}} /> })
  if (isAdmin) tabItems.push({ label: 'Approval Queue', content: <ApprovalQueue /> })

  return (
    <div>
      {/* Hero */}
      <ResearchCenterHero />

      {/* Tabs + Content */}
      <div id="publications" className="p-6 md:p-8">
        <Tabs items={tabItems} />
      </div>
    </div>
  )
}
