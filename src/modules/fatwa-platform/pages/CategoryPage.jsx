import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useFatwaStore } from '../stores/fatwaStore'
import { useCategories, getCategoryPath } from '../hooks/useCategories'
import { useBasePath } from '../hooks/useBasePath'
import { isValidCategoryName } from '../utils/categoryFilter'
import { detectDirection } from '../utils/rtlDetection'
import SEOHead from '../components/SEOHead'
import BreadcrumbNav from '../components/BreadcrumbNav'
import { FatwaCard } from '../components/FatwaCard'

/**
 * Reverse-lookup: given a slug, find the category name from the tree.
 */
function findCategoryNameBySlug(tree, slug, depth, parentPath = []) {
  if (depth === 0) {
    for (const [name, node] of Object.entries(tree)) {
      if (node.slug === slug) return name
    }
    return null
  }

  if (depth === 1 && parentPath.length >= 1) {
    const parentNode = tree[parentPath[0]]
    if (!parentNode) return null
    for (const [name, node] of Object.entries(parentNode.children)) {
      if (node.slug === slug) return name
    }
    return null
  }

  if (depth === 2 && parentPath.length >= 2) {
    const cat1Node = tree[parentPath[0]]
    if (!cat1Node) return null
    const cat2Node = cat1Node.children[parentPath[1]]
    if (!cat2Node) return null
    for (const [name, node] of Object.entries(cat2Node.children)) {
      if (node.slug === slug) return name
    }
    return null
  }

  return null
}

/**
 * CategoryPage — navigates through category hierarchy.
 *
 * Behavior:
 * - If the current category has subcategories → show subcategory cards only
 * - If the current category is a leaf (no subcategories) → show fatwas
 *
 * Routes:
 *   /fatwas/category/:cat1
 *   /fatwas/category/:cat1/:cat2
 *   /fatwas/category/:cat1/:cat2/:cat3
 */
export default function CategoryPage() {
  const { cat1, cat2, cat3 } = useParams()
  const basePath = useBasePath()
  const fetchFatwas = useFatwaStore((state) => state.fetchFatwas)
  const fetchFatwasByCategory = useFatwaStore((state) => state.fetchFatwasByCategory)
  const loading = useFatwaStore((state) => state.loading)
  const categoryLoading = useFatwaStore((state) => state.categoryLoading)
  const { tree } = useCategories()
  const [fatwas, setFatwas] = useState([])

  useEffect(() => {
    fetchFatwas()
  }, [fetchFatwas])

  // Resolve slugs to actual category names using the tree
  const resolvedNames = useMemo(() => {
    if (!tree || Object.keys(tree).length === 0) return null

    const cat1Name = findCategoryNameBySlug(tree, cat1, 0)
    if (!cat1Name) return null

    let cat2Name = null
    if (cat2) {
      cat2Name = findCategoryNameBySlug(tree, cat2, 1, [cat1Name])
      if (!cat2Name) return { cat1Name }
    }

    let cat3Name = null
    if (cat3 && cat2Name) {
      cat3Name = findCategoryNameBySlug(tree, cat3, 2, [cat1Name, cat2Name])
      if (!cat3Name) return { cat1Name, cat2Name }
    }

    return { cat1Name, cat2Name, cat3Name }
  }, [tree, cat1, cat2, cat3])

  // Determine current depth
  const depth = cat3 ? 3 : cat2 ? 2 : 1

  // Get the current category name for display
  const currentCategoryName = useMemo(() => {
    if (!resolvedNames) return ''
    if (depth === 3) return resolvedNames.cat3Name || ''
    if (depth === 2) return resolvedNames.cat2Name || ''
    return resolvedNames.cat1Name || ''
  }, [resolvedNames, depth])

  // Get child categories for the current level
  const childCategories = useMemo(() => {
    if (!resolvedNames || !resolvedNames.cat1Name || !tree) return []

    const cat1Node = tree[resolvedNames.cat1Name]
    if (!cat1Node) return []

    if (depth === 1) {
      return Object.values(cat1Node.children)
        .filter(child => isValidCategoryName(child.name))
        .sort((a, b) => b.count - a.count)
        .map((child) => ({
          name: child.name,
          slug: child.slug,
          count: child.count,
          hasChildren: Object.keys(child.children).length > 0,
          url: `${basePath}/category/${cat1}/${child.slug}`,
        }))
    }

    if (depth === 2 && resolvedNames.cat2Name) {
      const cat2Node = cat1Node.children[resolvedNames.cat2Name]
      if (!cat2Node) return []
      return Object.values(cat2Node.children)
        .filter(child => isValidCategoryName(child.name))
        .sort((a, b) => b.count - a.count)
        .map((child) => ({
          name: child.name,
          slug: child.slug,
          count: child.count,
          hasChildren: false,
          url: `${basePath}/category/${cat1}/${cat2}/${child.slug}`,
        }))
    }

    return []
  }, [tree, resolvedNames, depth, cat1, cat2, basePath])

  // Determine if this is a leaf category (no subcategories → show fatwas)
  const isLeaf = childCategories.length === 0

  // Fetch fatwas only when at a leaf category
  useEffect(() => {
    if (!resolvedNames || !resolvedNames.cat1Name) return
    if (!isLeaf) {
      setFatwas([])
      return
    }

    const load = async () => {
      const result = await fetchFatwasByCategory(
        resolvedNames.cat1Name,
        resolvedNames.cat2Name || undefined,
        resolvedNames.cat3Name || undefined
      )
      setFatwas(result || [])
    }
    load()
  }, [resolvedNames, fetchFatwasByCategory, isLeaf])

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items = [{ name: 'Home', url: basePath }]

    if (!resolvedNames || !resolvedNames.cat1Name) return items

    const categoryPath = getCategoryPath(
      tree,
      resolvedNames.cat1Name,
      resolvedNames.cat2Name,
      resolvedNames.cat3Name,
      basePath
    )

    for (const segment of categoryPath) {
      items.push({ name: segment.name, url: segment.path })
    }

    return items
  }, [tree, resolvedNames, basePath])

  // SEO
  const seoTitle = currentCategoryName
    ? `${currentCategoryName} | Hidayat Fatwa Platform`
    : 'Category | Hidayat Fatwa Platform'

  const seoDescription = currentCategoryName
    ? isLeaf
      ? `Browse fatwas in the ${currentCategoryName} category on Hidayat Fatwa Platform.`
      : `Explore subcategories of ${currentCategoryName} on Hidayat Fatwa Platform.`
    : 'Browse fatwas by category on Hidayat Fatwa Platform.'

  const canonicalUrl = `https://hidayat.org/fatwas/category/${[cat1, cat2, cat3].filter(Boolean).join('/')}`

  // Loading state
  if (loading && !tree) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        ogType="website"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <BreadcrumbNav items={breadcrumbItems} />

        {/* Category heading */}
        <header className="mb-8">
          <h1
            className={`text-2xl sm:text-3xl font-bold text-gray-900 mb-2 ${detectDirection(currentCategoryName) === 'rtl' ? 'font-urdu text-right' : ''}`}
            dir={detectDirection(currentCategoryName) === 'rtl' ? 'rtl' : undefined}
          >
            {currentCategoryName || 'Category'}
          </h1>
          {isLeaf ? (
            <p className="text-gray-500 text-sm">
              {categoryLoading ? 'Loading fatwas...' : `${fatwas.length} ${fatwas.length === 1 ? 'fatwa' : 'fatwas'}`}
            </p>
          ) : (
            <p className="text-gray-500 text-sm">
              {childCategories.length} {childCategories.length === 1 ? 'subcategory' : 'subcategories'}
            </p>
          )}
        </header>

        {/* Subcategories (when not a leaf) */}
        {!isLeaf && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {childCategories.map((child) => {
              const isChildRtl = detectDirection(child.name) === 'rtl'
              return (
                <Link
                  key={child.slug}
                  to={child.url}
                  className="group block bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-green-300 hover:scale-[1.02] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                >
                  <h3
                    className={`text-base font-semibold text-gray-800 mb-2 group-hover:text-green-700 transition-colors ${isChildRtl ? 'font-urdu text-right' : ''}`}
                    dir={isChildRtl ? 'rtl' : undefined}
                  >
                    {child.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {child.count.toLocaleString()} {child.count === 1 ? 'fatwa' : 'fatwas'}
                    </p>
                    {child.hasChildren && (
                      <span className="text-xs text-gray-400">Has subcategories</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Fatwas (when at a leaf category) */}
        {isLeaf && (
          <>
            {categoryLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-600 text-sm">Loading fatwas...</p>
                </div>
              </div>
            ) : fatwas.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">⚖️</div>
                <p className="text-base mb-4">No fatwas found in this category.</p>
                <Link
                  to={`${basePath}/categories`}
                  className="text-green-600 hover:text-green-700 underline text-sm"
                >
                  Browse all categories
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fatwas.map((fatwa) => (
                  <FatwaCard key={fatwa.id || fatwa.slug} fatwa={fatwa} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
