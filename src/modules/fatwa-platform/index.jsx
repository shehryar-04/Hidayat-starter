import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Code-split page components with React.lazy
const PlatformHomePage = lazy(() => import('./pages/PlatformHomePage'))
const SearchPage = lazy(() => import('./pages/EnterpriseSearchPage'))
const LegacySearchPage = lazy(() => import('./pages/SearchPage'))
const AllCategoriesPage = lazy(() => import('./pages/AllCategoriesPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const FatwaDetailPage = lazy(() => import('./pages/FatwaDetailPage'))
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'))
const SavedSearches = lazy(() => import('./pages/SavedSearches'))
const ModerationQueue = lazy(() => import('./pages/ModerationQueue'))
const SearchAnalytics = lazy(() => import('./pages/SearchAnalytics'))
const BulkImport = lazy(() => import('./pages/BulkImport'))

// Loading fallback shown while lazy chunks load — skeleton instead of blank
function PageLoader() {
  return (
    <div className="min-h-[60vh] px-4 py-8 max-w-6xl mx-auto">
      {/* Header skeleton */}
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mb-8" />
      {/* Content skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-3/4" />
            <div className="h-3 bg-gray-100 rounded animate-pulse mb-2 w-full" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
        ))}
      </div>
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
 *   /fatwas/bookmarks    → BookmarksPage (requires auth)
 *   /fatwas/alerts       → SavedSearches (requires auth)
 *   /fatwas/moderation   → ModerationQueue (admin/mufti)
 *   /fatwas/analytics    → SearchAnalytics (admin)
 *   /fatwas/import       → BulkImport (admin)
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
          <Route path="search/legacy" element={<LegacySearchPage />} />
          <Route path="bookmarks" element={<BookmarksPage />} />
          <Route path="alerts" element={<SavedSearches />} />
          <Route path="moderation" element={<ModerationQueue />} />
          <Route path="analytics" element={<SearchAnalytics />} />
          <Route path="import" element={<BulkImport />} />
          <Route path="categories" element={<AllCategoriesPage />} />
          <Route path="category/:cat1" element={<CategoryPage />} />
          <Route path="category/:cat1/:cat2" element={<CategoryPage />} />
          <Route path="category/:cat1/:cat2/:cat3" element={<CategoryPage />} />
          <Route path="id/:id" element={<FatwaDetailPage />} />
          <Route path=":slug" element={<FatwaDetailPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}
