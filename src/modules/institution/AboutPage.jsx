import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { ContentPage, PageHero, Section, CheckList } from './components/PageShell'
import {
  ORG,
  ABOUT_INTRO,
  ABOUT_STATS,
  CREDENTIALS,
  IDENTITY_FACTS,
  WHY_CHOOSE,
} from './institutionData'

export default function AboutPage() {
  return (
    <ContentPage title="About Hidayat">
      <PageHero
        eyebrow={`Established ${ORG.established} · ${ORG.headquarters}`}
        title="About Hidayat"
        description={ABOUT_INTRO[0]}
      >
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl">
          {ABOUT_STATS.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/10 border border-white/15 px-4 py-4">
              <div className="font-display font-bold text-xl sm:text-3xl">{stat.value}</div>
              <div className="text-[11px] sm:text-sm text-white/70 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </PageHero>

      <Section title="Our Approach" tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="space-y-5">
            {ABOUT_INTRO.map((p) => (
              <p key={p.slice(0, 30)} className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                {p}
              </p>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              {ORG.pillars.map((pillar) => (
                <span
                  key={pillar}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary-700"
                >
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  {pillar}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
            <h3 className="font-display font-semibold text-lg text-neutral-900 mb-5">
              Credentials & Affiliations
            </h3>
            <CheckList items={CREDENTIALS} columns={1} />
          </div>
        </div>
      </Section>

      <Section eyebrow="Organisation" title="Who We Are" tone="muted">
        <dl className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-200 overflow-hidden">
          {IDENTITY_FACTS.map((fact) => (
            <div key={fact.label} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 px-5 sm:px-8 py-4">
              <dt className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-400">
                {fact.label}
              </dt>
              <dd className="sm:col-span-2 text-sm sm:text-base text-neutral-800">
                {fact.label === 'Website' ? (
                  <a
                    href={ORG.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline underline-offset-4"
                  >
                    {fact.value}
                  </a>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section eyebrow="Why Hidayat" title="Why Choose Hidayat?" tone="white">
        <CheckList items={WHY_CHOOSE} columns={2} />
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/about/mission-values"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
          >
            Mission & Core Values
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
          >
            Explore Our Services
          </Link>
        </div>
      </Section>
    </ContentPage>
  )
}
