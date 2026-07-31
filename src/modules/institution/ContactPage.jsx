import { Link } from 'react-router-dom'
import { Phone, Globe, MapPin, Building2, Landmark, Briefcase, ArrowRight } from 'lucide-react'
import { ContentPage, PageHero, Section } from './components/PageShell'
import { WhatsAppButton } from '../../shared/WhatsAppButton'
import { ORG } from './institutionData'

const NEXT_STEPS = [
  {
    title: 'Ask a Shariah question',
    desc: 'Submit your question to our qualified Muftis through the Darul Ifta portal.',
    to: '/darul-ifta',
  },
  {
    title: 'Enrol in a short course',
    desc: 'Browse certified, time-bounded courses and register online.',
    to: '/short-courses',
  },
  {
    title: 'Request corporate training',
    desc: 'Tailored in-house programs for organizations and corporate teams.',
    to: '/services/training',
  },
  {
    title: 'Discuss a consultancy engagement',
    desc: 'Halal, finance, business development, and Shariah compliance advisory.',
    to: '/services/consultancy',
  },
]

export default function ContactPage() {
  return (
    <ContentPage title="Contact Us">
      <PageHero
        eyebrow="Get in Touch"
        title="Contact Hidayat"
        description={`${ORG.pillars.join(' · ')}. We would be glad to hear from you.`}
      />

      <Section tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-neutral-900 mb-6">Contact details</h2>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Phone</div>
                  <a
                    href={`tel:${ORG.phoneIntl}`}
                    className="text-sm sm:text-base text-neutral-800 hover:text-primary-600 transition-colors"
                  >
                    {ORG.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Globe className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Website</div>
                  <a
                    href={ORG.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-neutral-800 hover:text-primary-600 transition-colors"
                  >
                    {ORG.website}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Location</div>
                  <p className="text-sm sm:text-base text-neutral-800">
                    {ORG.city}, {ORG.country}
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-8">
              <WhatsAppButton
                message="Assalamu Alaikum, I would like to know more about Hidayat's programs and services."
                label="Message us on WhatsApp"
              />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
            <h2 className="font-display font-bold text-lg sm:text-xl text-neutral-900 mb-6">
              Registration & affiliations
            </h2>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <Building2 className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Registration</div>
                  <p className="text-sm text-neutral-700">{ORG.registration}</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Landmark className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Chamber</div>
                  <p className="text-sm text-neutral-700">{ORG.chamber}</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Briefcase className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Parent company</div>
                  <p className="text-sm text-neutral-700">{ORG.parentCompany}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section eyebrow="Next Steps" title="How can we help?" tone="muted">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {NEXT_STEPS.map((step) => (
            <Link
              key={step.to}
              to={step.to}
              className="group rounded-xl border border-neutral-200 bg-white p-6 hover:border-primary-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display font-semibold text-base sm:text-lg text-neutral-900 group-hover:text-primary-600 transition-colors">
                  {step.title}
                </h3>
                <ArrowRight
                  className="w-5 h-5 text-neutral-400 flex-shrink-0 group-hover:text-primary-500 group-hover:translate-x-1 transition-all"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{step.desc}</p>
            </Link>
          ))}
        </div>
      </Section>
    </ContentPage>
  )
}
