import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ContentPage, PageHero, Section, CheckList } from './components/PageShell'
import { CONSULTANCY_INTRO, CONSULTANCY_SERVICES, CONSULTANCY_CLOSING } from './institutionData'

const DOMAINS = ['Food', 'Finance', 'Business Development', 'Shariah Compliance']

export default function ConsultancyPage() {
  return (
    <ContentPage title="Consultancy Services">
      <PageHero
        eyebrow="Professional Advisory & Solutions"
        title="Consultancy Services"
        description={CONSULTANCY_INTRO}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          {DOMAINS.map((domain) => (
            <span
              key={domain}
              className="rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs sm:text-sm font-medium"
            >
              {domain}
            </span>
          ))}
        </div>
      </PageHero>

      <Section eyebrow="Scope" title="Advisory areas" tone="white">
        <CheckList items={CONSULTANCY_SERVICES} columns={2} />
      </Section>

      <Section tone="muted">
        <div className="rounded-xl bg-white border border-neutral-200 p-6 sm:p-10">
          <p className="font-display text-base sm:text-xl text-neutral-800 leading-relaxed">
            {CONSULTANCY_CLOSING}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              Request a consultation
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/services/training"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
            >
              Corporate training options
            </Link>
          </div>
        </div>
      </Section>
    </ContentPage>
  )
}
