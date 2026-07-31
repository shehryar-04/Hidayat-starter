import { ContentPage, PageHero, Section } from './components/PageShell'
import { LAST_UPDATED } from './legalContent'

/**
 * Renders a long-form legal document from a section array.
 * Each section may carry `paragraphs` and/or a `list`.
 */
export default function LegalPage({ title, eyebrow, intro, sections }) {
  return (
    <ContentPage title={title}>
      <PageHero eyebrow={eyebrow} title={title} description={intro}>
        <p className="mt-6 text-xs sm:text-sm text-white/60">Last updated: {LAST_UPDATED}</p>
      </PageHero>

      <Section tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* On this page */}
          <nav aria-label="On this page" className="lg:col-span-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">On this page</h2>
            <ol className="space-y-2 lg:sticky lg:top-24">
              {sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${slugify(section.heading)}`}
                    className="text-sm text-neutral-500 hover:text-primary-600 transition-colors"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="lg:col-span-3 space-y-10">
            {sections.map((section) => (
              <article key={section.heading} id={slugify(section.heading)} className="scroll-mt-24">
                <h2 className="font-display font-bold text-lg sm:text-2xl text-neutral-900 mb-4">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((p) => (
                  <p key={p.slice(0, 40)} className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-4">
                    {p}
                  </p>
                ))}
                {section.list && (
                  <ul className="space-y-2.5 mb-4">
                    {section.list.map((item) => (
                      <li key={item.slice(0, 40)} className="flex gap-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
                        <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </Section>
    </ContentPage>
  )
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
