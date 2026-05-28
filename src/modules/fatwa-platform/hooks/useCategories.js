import { useMemo } from 'react'
import { useFatwaStore } from '../stores/fatwaStore'
import { isValidCategoryName } from '../utils/categoryFilter'
import { slugify } from '../utils/slugGenerator'

/**
 * Build a nested 3-level category tree from flat fatwa data.
 * Each node has: name, slug, count (including descendants), children.
 *
 * The count at each level represents the total number of fatwas
 * in that category AND all its descendants.
 */
export function buildCategoryTree(fatwas) {
  const tree = Object.create(null)

  for (const fatwa of fatwas) {
    const { category_1, category_2, category_3 } = fatwa
    if (!category_1) continue

    // Ensure category_1 node exists
    if (!tree[category_1]) {
      tree[category_1] = {
        name: category_1,
        slug: slugify(category_1),
        count: 0,
        children: Object.create(null),
      }
    }
    tree[category_1].count++

    // Ensure category_2 node exists under category_1
    if (category_2) {
      if (!tree[category_1].children[category_2]) {
        tree[category_1].children[category_2] = {
          name: category_2,
          slug: slugify(category_2),
          count: 0,
          children: Object.create(null),
        }
      }
      tree[category_1].children[category_2].count++

      // Ensure category_3 node exists under category_2
      if (category_3) {
        if (!tree[category_1].children[category_2].children[category_3]) {
          tree[category_1].children[category_2].children[category_3] = {
            name: category_3,
            slug: slugify(category_3),
            count: 0,
            children: Object.create(null),
          }
        }
        tree[category_1].children[category_2].children[category_3].count++
      }
    }
  }

  return tree
}

/**
 * Custom hook that returns the category tree from the store.
 * Filters out categories with corrupted/garbled names.
 *
 * Returns:
 * - tree: The nested category tree object (built from all fatwas via RPC or fallback)
 * - topLevelCategories: A flat array of top-level category objects (name, slug, count, children)
 *
 * @returns {{ tree: object, topLevelCategories: Array }}
 */
export function useCategories() {
  const categories = useFatwaStore((state) => state.categories)

  const tree = useMemo(() => {
    if (!categories || Object.keys(categories).length === 0) return {}

    // Filter out categories with corrupted names
    const filtered = {}
    for (const [name, node] of Object.entries(categories)) {
      if (!isValidCategoryName(name)) continue
      filtered[name] = node
    }
    return filtered
  }, [categories])

  const topLevelCategories = useMemo(
    () => Object.values(tree),
    [tree]
  )

  return { tree, topLevelCategories }
}

/**
 * Get the breadcrumb path for a given category combination.
 * Returns an array of { name, slug, path } objects representing
 * the breadcrumb trail from the top-level category down.
 *
 * @param {object} tree - The category tree object
 * @param {string} [cat1] - Top-level category name
 * @param {string} [cat2] - Mid-level category name
 * @param {string} [cat3] - Specific category name
 * @param {string} [basePath='/fatwas'] - Base path for URLs
 * @returns {Array<{ name: string, slug: string, path: string }>}
 */
export function getCategoryPath(tree, cat1, cat2, cat3, basePath = '/fatwas') {
  const path = []

  if (!cat1 || !tree[cat1]) return path

  const cat1Node = tree[cat1]
  path.push({
    name: cat1Node.name,
    slug: cat1Node.slug,
    path: `${basePath}/category/${cat1Node.slug}`,
  })

  if (!cat2 || !cat1Node.children[cat2]) return path

  const cat2Node = cat1Node.children[cat2]
  path.push({
    name: cat2Node.name,
    slug: cat2Node.slug,
    path: `${basePath}/category/${cat1Node.slug}/${cat2Node.slug}`,
  })

  if (!cat3 || !cat2Node.children[cat3]) return path

  const cat3Node = cat2Node.children[cat3]
  path.push({
    name: cat3Node.name,
    slug: cat3Node.slug,
    path: `${basePath}/category/${cat1Node.slug}/${cat2Node.slug}/${cat3Node.slug}`,
  })

  return path
}
