import { Link } from 'react-router-dom'
import { GraduationCap, Users } from 'lucide-react'
import { ContentPage, PageHero, Section, CheckList } from './components/PageShell'
import { TRAINING_INTRO, TRAINING_AREAS, TRAINING_METHODOLOGY, EVENTS } from './institutionData'

const PAST_EVENTS = EVENTS.slice(0, 3)

export default function TrainingPage() {
  return (
    <ContentPage title="Training & Workshops">
      <PageHero
        eyebrow="Programs & Training Methodology"
        title="Training & Workshops"
        description={TRAINING_INTRO}
      />

      <Section eyebrow="Expertise" title="Areas of Training Expertise" tone="white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {TRAINING_AREAS.map((area) => (
            <div
              key={area}
              className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4"
            >
              <GraduationCap className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm sm:text-base text-neutral-700">{area}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="How We Teach"
        title="Our Training Methodology"
        description="Practical, development-focused delivery that turns knowledge into real-world application."
        tone="muted"
      >
        <CheckList items={TRAINING_METHODOLOGY} columns={2} />
      </Section>

      <Section eyebrow="Track Record" title="Past Training Events" tone="white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {PAST_EVENTS.map((event) => (
            <article key={event.name} className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-primary-500" aria-hidden="true" />
              </div>
              <h3 className="font-display font-semibold text-base text-neutral-900 mb-2">{event.name}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{event.description}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary-500">
                {event.focus}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
          >
            See all events & activities
          </Link>
        </div>
      </Section>
    </ContentPage>
  )
}
