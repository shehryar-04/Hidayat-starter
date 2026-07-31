import { Link } from 'react-router-dom'
import { Globe2, ArrowRight } from 'lucide-react'
import { ContentPage, PageHero, Section, CheckList } from './components/PageShell'
import { DISTANCE_LEARNING_INTRO, DISTANCE_LEARNING_FEATURES, IFTA_INTRO, IFTA_FEATURES } from './institutionData'

export default function DistanceLearningPage() {
  return (
    <ContentPage title="Distance Learning">
      <PageHero
        eyebrow="Virtual & Online Education Platform"
        title="Distance Learning"
        description={DISTANCE_LEARNING_INTRO}
      />

      <Section eyebrow="Platform" title="What the platform offers" tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <CheckList items={DISTANCE_LEARNING_FEATURES} columns={2} />
          </div>
          <aside className="rounded-xl bg-primary-50 border border-primary-200 p-6">
            <Globe2 className="w-8 h-8 text-primary-500 mb-4" aria-hidden="true" />
            <h3 className="font-display font-semibold text-lg text-primary-900 mb-2">No geographical barriers</h3>
            <p className="text-sm text-primary-800/80 leading-relaxed">
              Students, professionals, and overseas Muslims can study flexibly from anywhere in the world.
            </p>
            <Link
              to="/short-courses"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Browse short courses
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </Section>

      <Section eyebrow="Islamic Guidance" title="Online Dar-ul-Ifta" description={IFTA_INTRO} tone="muted">
        <CheckList items={IFTA_FEATURES} columns={2} />
        <div className="mt-10">
          <Link
            to="/darul-ifta"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
          >
            Visit Darul Ifta
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </Section>
    </ContentPage>
  )
}
