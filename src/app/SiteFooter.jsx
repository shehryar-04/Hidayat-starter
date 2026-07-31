import { Link } from 'react-router-dom'
import { MapPin, Phone, Globe, MessageCircle } from 'lucide-react'
import Logo from './Logo'
import { ORG } from '../modules/institution/institutionData'

/**
 * Site-wide footer.
 *
 * Every link resolves to a real route — the institutional pages under
 * /about, /services, /events, /contact plus the existing feature modules.
 * Contact details come from the official company profile (institutionData.js).
 */

const COLUMNS = [
  {
    heading: 'Programs',
    links: [
      { label: 'Darse Nizami', to: '/dars-e-nizami' },
      { label: 'Hifz & Nazrah', to: '/hifz' },
      { label: 'Short Courses', to: '/short-courses' },
      { label: 'Darul Ifta', to: '/darul-ifta' },
      { label: 'Distance Learning', to: '/services/distance-learning' },
    ],
  },
  {
    heading: 'Institute',
    links: [
      { label: 'About Hidayat', to: '/about' },
      { label: "Director's Message", to: '/about/directors-message' },
      { label: 'Mission & Values', to: '/about/mission-values' },
      { label: 'Expert Trainers', to: '/about/trainers' },
      { label: 'Events & Activities', to: '/events' },
    ],
  },
  {
    heading: 'Services',
    links: [
      { label: 'All Services', to: '/services' },
      { label: 'Training & Workshops', to: '/services/training' },
      { label: 'Consultancy', to: '/services/consultancy' },
      { label: 'Research Center', to: '/research-center' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Fatwa Archive', to: '/fatwas' },
      { label: 'Articles', to: '/articles' },
      { label: 'Downloads', to: '/downloads' },
      { label: 'Student Portal', to: '/login' },
    ],
  },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms-of-service' },
  { label: 'Contact Us', to: '/contact' },
]

const linkClass =
  'font-sans text-sm text-neutral-500 hover:text-primary-500 transition-colors'

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-neutral-200 bg-neutral-50">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 px-4 sm:px-8 py-10 sm:py-16 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="col-span-2 md:col-span-3 lg:col-span-2">
          <Logo size="md" className="mb-4" />
          <p className="font-sans text-sm leading-relaxed text-neutral-500">
            Dedicated to professional excellence, intellectual development, Islamic guidance, and
            capacity building through modern education and training.
          </p>
          <p className="font-sans text-xs text-neutral-400 mt-4">
            {ORG.registration} · {ORG.chamber}
          </p>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h4 className="font-display font-semibold text-neutral-900 text-base mb-4 sm:mb-6">
              {col.heading}
            </h4>
            <ul className="space-y-3 sm:space-y-4">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Contact */}
        <div className="col-span-2 md:col-span-1">
          <h4 className="font-display font-semibold text-neutral-900 text-base mb-4 sm:mb-6">Contact</h4>
          <ul className="space-y-3 sm:space-y-4">
            <li className="flex items-start gap-3 text-neutral-500">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="font-sans text-sm">{ORG.headquarters}</span>
            </li>
            <li className="flex items-center gap-3 text-neutral-500">
              <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <a href={`tel:${ORG.phoneIntl}`} className={linkClass}>
                {ORG.phone}
              </a>
            </li>
            <li className="flex items-center gap-3 text-neutral-500">
              <MessageCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <a
                href={`https://wa.me/${ORG.phoneIntl.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                WhatsApp
              </a>
            </li>
            <li className="flex items-center gap-3 text-neutral-500">
              <Globe className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <a href={ORG.websiteUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {ORG.website}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full py-6 sm:py-8 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto border-t border-neutral-200 gap-4">
        <p className="font-sans text-sm text-neutral-500 text-center sm:text-left">
          © {new Date().getFullYear()} Hidayat Academy of Islamic Sciences. {ORG.tagline}.
        </p>
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-4 sm:gap-8">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-neutral-500 hover:text-primary-500 font-sans text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
