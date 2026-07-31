import { Target, Eye } from 'lucide-react'
import { ContentPage, PageHero, Section } from './components/PageShell'
import { MISSION, VISION, CORE_VALUES } from './institutionData'

export default function MissionValuesPage() {
  return (
    <ContentPage title="Mission & Core Values">
      <PageHero
        eyebrow="Purpose, Vision & Guiding Principles"
        title="Mission, Vision & Core Values"
        description="The principles that shape every program, service, and interaction at Hidayat."
      />

      <Section tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <article className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-5">
              <Target className="w-6 h-6 text-primary-500" aria-hidden="true" />
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-neutral-900 mb-4">Our Mission</h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">{MISSION}</p>
          </article>

          <article className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-5">
              <Eye className="w-6 h-6 text-primary-500" aria-hidden="true" />
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-neutral-900 mb-4">Our Vision</h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">{VISION}</p>
          </article>
        </div>
      </Section>

      <Section
        eyebrow="What We Stand For"
        title="Core Values"
        description="Ten commitments that guide our teaching, research, consultancy, and community work."
        tone="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {CORE_VALUES.map((value, i) => (
            <article
              key={value.title}
              className="rounded-xl bg-white border border-neutral-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <span className="font-display text-sm font-bold text-primary-400">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display font-semibold text-base sm:text-lg text-neutral-900 mt-2 mb-2">
                {value.title}
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{value.desc}</p>
            </article>
          ))}
        </div>
      </Section>
    </ContentPage>
  )
}
