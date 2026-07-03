import { Link } from 'react-router-dom'
import { Bookmark, ExternalLink } from 'lucide-react'
import { useBookmarks } from '../hooks/useBookmarks'
import BookmarkButton from '../components/BookmarkButton'
import { Spinner, EmptyState, PageWrapper, PageHeader } from '../../../shared/ui'

/**
 * BookmarksPage — Displays all saved/bookmarked fatwas for the current user.
 */
export default function BookmarksPage() {
  const { bookmarks, loading, toggleBookmark, isBookmarked } = useBookmarks()

  return (
    <PageWrapper>
      <PageHeader
        title="Saved Fatwas"
        description="Your bookmarked fatwas for quick reference."
        icon={<Bookmark className="text-primary" />}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : bookmarks.length === 0 ? (
        <EmptyState
          title="No saved fatwas"
          description="Bookmark fatwas while browsing to save them here for later."
        />
      ) : (
        <div className="space-y-2">
          {bookmarks.map((b) => {
            const fatwa = b.fatwas
            if (!fatwa) return null
            return (
              <div
                key={b.fatwa_id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <BookmarkButton
                  isBookmarked={isBookmarked(b.fatwa_id)}
                  onToggle={() => toggleBookmark(b.fatwa_id)}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/darul-iftaa/${fatwa.slug || fatwa.id}`}
                    className="text-sm font-medium text-gray-800 hover:text-primary line-clamp-1 transition-colors"
                  >
                    {fatwa.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {fatwa.category_1 && (
                      <span className="text-xs text-gray-400">
                        {[fatwa.category_1, fatwa.category_2].filter(Boolean).join(' > ')}
                      </span>
                    )}
                    {fatwa.dar_ul_ifta && (
                      <span className="text-xs text-gray-400">• {fatwa.dar_ul_ifta}</span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/darul-iftaa/${fatwa.slug || fatwa.id}`}
                  className="text-gray-400 hover:text-primary p-1"
                  title="View fatwa"
                >
                  <ExternalLink size={14} />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}
