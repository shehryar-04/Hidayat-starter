import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { ContentPage, PageHero, Section } from './components/PageShell'
import { SERVICES, SERVED_AUDIENCES } from './institutionData'

const RELATED = [
  { label: 'Training & Workshops', to: '/services/training' },
  { label: 'Consultancy Services', to: '/services/consultancy' },
  { label: 'Distance Learning', to: '/services/distance-learning' },
  { label: 'Online Dar-ul-Ifta', to: '/darul-ifta' },
]

export default function ServicesPage() {
  return (
    <ContentPage title="Our Services">
      <PageHero
        eyebrow="Complete Service Portfolio"
        title="Our Services"
        description="Hidayat offers a comprehensive range of professional, educational, and Islamic services designed to empower individuals, organizations, and communities across Pakistan and beyond."
      />

      <Section tone="white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {SERVICES.map((service) => {
            const Icon = Icons[service.icon] || Icons.Circle
            return (
              <article
                key={service.title}
                className="group rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-5 group-hover:bg-primary-500 transition-colors duration-200">
                  <Icon
                    className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors duration-200"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-display font-semibold text-base sm:text-lg text-neutral-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{service.desc}</p>
              </article>
            )
          })}
        </div>
      </Section>

      <Section eyebrow="Who We Serve" title="Built for every kind of learner" tone="muted">
        <div className="flex flex-wrap gap-3">
          {SERVED_AUDIENCES.map((audience) => (
            <span
              key={audience}
              className="rounded-full bg-white border border-neutral-200 px-5 py-2 text-sm font-medium text-neutral-700"
            >
              {audience}
            </span>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RELATED.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-6 py-5 hover:border-primary-300 transition-colors"
            >
              <span className="font-display font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {item.label}
              </span>
              <ArrowRight
                className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </Section>
    </ContentPage>
  )
}
