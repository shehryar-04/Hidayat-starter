import { ContentPage, PageHero, Section } from './components/PageShell'
import { EVENTS_INTRO, EVENTS, EVENT_GALLERY } from './institutionData'

export default function EventsPage() {
  return (
    <ContentPage title="Events & Activities">
      <PageHero
        eyebrow="Our Activities"
        title="Events, Achievements & Activities"
        description={EVENTS_INTRO}
      />

      <Section eyebrow="Programme" title="Our events & activities" tone="white">
        {/* Table on larger screens */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-left">
            <caption className="sr-only">Hidayat events with descriptions and focus areas</caption>
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Event</th>
                <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Description</th>
                <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Focus Area</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {EVENTS.map((event) => (
                <tr key={event.name}>
                  <th scope="row" className="px-6 py-5 font-display font-semibold text-sm text-neutral-900 align-top">
                    {event.name}
                  </th>
                  <td className="px-6 py-5 text-sm text-neutral-600 align-top">{event.description}</td>
                  <td className="px-6 py-5 text-sm text-primary-600 align-top">{event.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards on mobile */}
        <div className="md:hidden space-y-4">
          {EVENTS.map((event) => (
            <article key={event.name} className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="font-display font-semibold text-base text-neutral-900">{event.name}</h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{event.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-primary-500">{event.focus}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Gallery"
        title="Event highlights & special memories"
        description="Moments from our workshops, seminars, and diploma ceremonies."
        tone="muted"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {EVENT_GALLERY.map((photo) => (
            <figure key={photo.src} className="group overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <img
                src={photo.src}
                alt={photo.caption}
                loading="lazy"
                className="h-32 sm:h-44 w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <figcaption className="px-3 py-2.5 text-xs sm:text-sm text-neutral-600">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </ContentPage>
  )
}
