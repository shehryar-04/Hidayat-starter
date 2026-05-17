/**
 * Related Fatwas Engine
 *
 * Identifies fatwas related to the current one based on category hierarchy.
 * Priority: same category_3 first, supplement with category_2 if fewer than 3
 * share category_3.
 *
 * @param {object} currentFatwa - The fatwa currently being viewed
 * @param {object[]} allFatwas - All available published fatwas
 * @param {number} [maxCount=6] - Maximum number of related fatwas to return
 * @returns {object[]} Array of related fatwas, ordered by relevance
 */
export function getRelatedFatwas(currentFatwa, allFatwas, maxCount = 6) {
  if (!currentFatwa || !allFatwas || !Array.isArray(allFatwas)) {
    return []
  }

  // Find fatwas sharing the same category_3 (most specific match)
  const sameCat3 = allFatwas.filter(
    (f) =>
      f.id !== currentFatwa.id &&
      f.category_3 === currentFatwa.category_3 &&
      currentFatwa.category_3 != null
  )

  // If we have 3 or more from category_3, return those (up to maxCount)
  if (sameCat3.length >= 3) {
    return sameCat3.slice(0, maxCount)
  }

  // Supplement with fatwas from the same category_2 (excluding those already in sameCat3)
  const sameCat3Ids = new Set(sameCat3.map((f) => f.id))
  const sameCat2 = allFatwas.filter(
    (f) =>
      f.id !== currentFatwa.id &&
      f.category_2 === currentFatwa.category_2 &&
      currentFatwa.category_2 != null &&
      !sameCat3Ids.has(f.id)
  )

  return [...sameCat3, ...sameCat2].slice(0, maxCount)
}
