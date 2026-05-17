import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Code-split page components with React.lazy
const PlatformHomePage = lazy(() => import('./pages/PlatformHomePage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const AllCategoriesPage = lazy(() => import('./pages/AllCategoriesPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const FatwaDetailPage = lazy(() => import('./pages/FatwaDetailPage'))

// Loading fallback shown while lazy chunks load
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-pulse text-primary font-medium">Loading…</div>
    </div>
  )
}

/**
 * Fatwa Knowledge Platform module.
 * All routes are public (no auth wrapper needed).
 *
 * Route structure:
 *   /fatwas              → PlatformHomePage
 *   /fatwas/search       → SearchPage
 *   /fatwas/category/:cat1            → CategoryPage (level 1)
 *   /fatwas/category/:cat1/:cat2      → CategoryPage (level 2)
 *   /fatwas/category/:cat1/:cat2/:cat3 → CategoryPage (level 3)
 *   /fatwas/:slug        → FatwaDetailPage
 */
export default function FatwaPlatformModule() {
  return (
    <div className="fatwa-platform">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<PlatformHomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="categories" element={<AllCategoriesPage />} />
          <Route path="category/:cat1" element={<CategoryPage />} />
          <Route path="category/:cat1/:cat2" element={<CategoryPage />} />
          <Route path="category/:cat1/:cat2/:cat3" element={<CategoryPage />} />
          <Route path=":slug" element={<FatwaDetailPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}
