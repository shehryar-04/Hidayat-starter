import { Quote } from 'lucide-react'
import { ContentPage, PageHero, Section } from './components/PageShell'
import { DIRECTOR } from './institutionData'

export default function DirectorMessagePage() {
  return (
    <ContentPage title="Director's Message">
      <PageHero
        eyebrow="Leadership Vision & Commitment"
        title="Director's Message"
        description={`“${DIRECTOR.greeting}”`}
      />

      <Section tone="white">
        <div className="max-w-3xl">
          <Quote className="w-10 h-10 text-primary-200 mb-6" aria-hidden="true" />
          <div className="space-y-5">
            {DIRECTOR.paragraphs.map((p) => (
              <p key={p.slice(0, 30)} className="text-sm sm:text-lg text-neutral-600 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          <figure className="mt-10 border-t border-neutral-200 pt-6">
            <figcaption>
              <div className="font-display font-semibold text-lg text-neutral-900">{DIRECTOR.name}</div>
              <div className="text-sm text-neutral-500 mt-1">{DIRECTOR.title}</div>
              <div className="text-sm text-neutral-400">{DIRECTOR.organisation}</div>
            </figcaption>
          </figure>

          <blockquote className="mt-10 rounded-xl bg-primary-50 border border-primary-200 p-6 sm:p-8">
            <p className="font-display text-base sm:text-xl text-primary-800 leading-relaxed italic">
              “{DIRECTOR.closingDua}”
            </p>
          </blockquote>
        </div>
      </Section>
    </ContentPage>
  )
}
