import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown, Menu, X } from 'lucide-react'
import { useBasePath } from '../hooks/useBasePath'

/**
 * CategorySidebar — Desktop sticky tree / Mobile collapsible accordion.
 *
 * Displays a 3-level category hierarchy with expand/collapse, fatwa counts,
 * active path highlighting, and full keyboard accessibility.
 *
 * @param {{
 *   categories: object,
 *   currentPath: string[],
 *   onNavigate: (path: string[]) => void
 * }} props
 */
export default function CategorySidebar({ categories, currentPath = [], onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const basePath = useBasePath()

  if (!categories || Object.keys(categories).length === 0) return null

  const categoryEntries = Object.values(categories)
  const categoryBasePath = `${basePath}/category`

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
        aria-label="Category navigation"
      >
        <nav>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Categories</h2>
          <ul role="tree" className="space-y-1">
            {categoryEntries.map((cat) => (
              <CategoryNode
                key={cat.slug}
                node={cat}
                depth={0}
                currentPath={currentPath}
                basePath={categoryBasePath}
                pathSlugs={[]}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile accordion */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex items-center gap-2 w-full px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm text-left font-medium text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          aria-expanded={mobileOpen}
          aria-controls="mobile-category-menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
          <span>Browse Categories</span>
        </button>

        {mobileOpen && (
          <nav
            id="mobile-category-menu"
            className="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
            aria-label="Category navigation"
          >
            <ul role="tree" className="space-y-1">
              {categoryEntries.map((cat) => (
                <CategoryNode
                  key={cat.slug}
                  node={cat}
                  depth={0}
                  currentPath={currentPath}
                  basePath={categoryBasePath}
                  pathSlugs={[]}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </nav>
        )}
      </div>
    </>
  )
}

/**
 * Recursive tree node for a single category level.
 */
function CategoryNode({ node, depth, currentPath, basePath, pathSlugs, onNavigate }) {
  const currentSlugs = [...pathSlugs, node.slug]
  const isActive = currentPath[depth] === node.slug
  const children = Object.values(node.children || {})
  const hasChildren = children.length > 0

  // Auto-expand if this node is in the active path
  const [expanded, setExpanded] = useState(isActive)

  const categoryUrl = `${basePath}/${currentSlugs.join('/')}`

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const handleNavigate = useCallback(() => {
    if (onNavigate) {
      onNavigate(currentSlugs)
    }
  }, [onNavigate, currentSlugs])

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        className={`flex items-center gap-1 rounded-md transition-colors ${
          isActive
            ? 'bg-green-50 text-green-700'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="w-6" aria-hidden="true" />
        )}

        {/* Category link */}
        <Link
          to={categoryUrl}
          onClick={handleNavigate}
          className={`flex-1 flex items-center justify-between py-1.5 px-1 rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 ${
            isActive ? 'font-semibold' : ''
          }`}
          aria-current={isActive && depth === currentPath.length - 1 ? 'page' : undefined}
        >
          <span className="truncate">{node.name}</span>
          <span
            className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
            aria-label={`${node.count} fatwas`}
          >
            {node.count}
          </span>
        </Link>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <ul role="group" className="mt-0.5">
          {children.map((child) => (
            <CategoryNode
              key={child.slug}
              node={child}
              depth={depth + 1}
              currentPath={currentPath}
              basePath={basePath}
              pathSlugs={currentSlugs}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
