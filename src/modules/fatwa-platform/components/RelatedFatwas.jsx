import { FatwaCard } from './FatwaCard'

/**
 * RelatedFatwas — displays up to 6 related fatwa cards in a responsive grid.
 * Returns null if no related fatwas are provided.
 *
 * @param {{ fatwas: Array<{ title: string, slug: string, reference_number: string, category_1: string, dar_ul_ifta: string }> }} props
 */
export function RelatedFatwas({ fatwas = [] }) {
  if (!fatwas || fatwas.length === 0) return null

  const displayedFatwas = fatwas.slice(0, 6)

  return (
    <section aria-labelledby="related-fatwas-heading">
      <h2
        id="related-fatwas-heading"
        className="text-xl font-bold text-gray-800 mb-4"
      >
        Related Fatwas
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedFatwas.map((fatwa) => (
          <FatwaCard key={fatwa.slug} fatwa={fatwa} />
        ))}
      </div>
    </section>
  )
}
