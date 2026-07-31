import { ContentPage, PageHero, Section } from './components/PageShell'
import { TRAINER_GROUPS } from './institutionData'

function initialsOf(name) {
  return name
    .replace(/^(Dr\.|Mr\.|Ms\.|Mufti|Hafiz|Molana)\s+/gi, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export default function TrainersPage() {
  const total = TRAINER_GROUPS.reduce((sum, group) => sum + group.members.length, 0)

  return (
    <ContentPage title="Our Expert Trainers">
      <PageHero
        eyebrow="Distinguished Faculty & Scholars"
        title="Our Expert Trainers"
        description="Hidayat's panel of scholars, researchers, trainers, and industry experts brings together academic excellence, practical experience, and deep Islamic understanding from renowned universities, corporate sectors, and research institutions."
      >
        <p className="mt-6 text-sm text-white/70">
          {total} trainers across {TRAINER_GROUPS.length} specialisations
        </p>
      </PageHero>

      {TRAINER_GROUPS.map((group, index) => (
        <Section
          key={group.category}
          eyebrow="Specialisation"
          title={group.category}
          tone={index % 2 === 0 ? 'white' : 'muted'}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {group.members.map((member) => (
              <article
                key={member.name}
                className="flex gap-4 sm:gap-5 rounded-xl border border-neutral-200 bg-white p-5 sm:p-6"
              >
                <div
                  aria-hidden="true"
                  className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full bg-primary-50 text-primary-600 font-display font-bold flex items-center justify-center text-sm sm:text-base"
                >
                  {initialsOf(member.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-base sm:text-lg text-neutral-900">
                    {member.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-primary-600 mt-1">{member.credentials}</p>
                  <p className="text-sm text-neutral-500 mt-3 leading-relaxed">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>
      ))}
    </ContentPage>
  )
}
