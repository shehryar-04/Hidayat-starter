import { Link } from 'react-router-dom'
import { Heart, ExternalLink, Trash2, AlertTriangle } from 'lucide-react'
import { useLocalSavedFatwas } from '../hooks/useLocalSavedFatwas'
import SaveFatwaButton from '../components/SaveFatwaButton'
import { Button, EmptyState, PageWrapper, PageHeader, Badge } from '../../../shared/ui'

/**
 * SavedFatwasPage — Shows all locally-saved fatwas (stored in browser).
 * No login required. Persists until browser storage is cleared.
 * Route: /fatwas/saved or /darul-iftaa/saved
 */
export default function SavedFatwasPage() {
  const { savedFatwas, removeFatwa, isSaved, toggleSave, clearAll, count } = useLocalSavedFatwas()

  return (
    <PageWrapper>
      <PageHeader
        title="Saved Fatwas"
        description="Your locally saved fatwas. These are stored in your browser and available offline."
        icon={<Heart className="text-red-500" />}
      />

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          Saved fatwas are stored in your browser's local storage. They will be removed if you clear your browser data or use a different device.
        </p>
      </div>

      {count > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">{count} saved fatwa{count !== 1 ? 's' : ''}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
            onClick={() => { if (confirm('Remove all saved fatwas?')) clearAll() }}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
          </Button>
        </div>
      )}

      {count === 0 ? (
        <EmptyState
          title="No saved fatwas"
          description="Tap the heart icon on any fatwa to save it here for quick access later."
        />
      ) : (
        <div className="space-y-2">
          {savedFatwas.map((fatwa) => (
            <div
              key={fatwa.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group"
            >
              <SaveFatwaButton
                isSaved={true}
                onToggle={() => removeFatwa(fatwa.id)}
                size="sm"
              />

              <div className="flex-1 min-w-0">
                <Link
                  to={`/darul-iftaa/${fatwa.slug || fatwa.id}`}
                  className="text-sm font-medium text-gray-800 hover:text-primary line-clamp-1 transition-colors"
                >
                  {fatwa.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {fatwa.category_1 && (
                    <span className="text-xs text-gray-400">
                      {[fatwa.category_1, fatwa.category_2].filter(Boolean).join(' > ')}
                    </span>
                  )}
                  {fatwa.dar_ul_ifta && (
                    <span className="text-xs text-gray-400">• {fatwa.dar_ul_ifta}</span>
                  )}
                  <span className="text-[10px] text-gray-300">
                    Saved {new Date(fatwa.saved_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Link
                to={`/darul-iftaa/${fatwa.slug || fatwa.id}`}
                className="text-gray-400 hover:text-primary p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="View fatwa"
              >
                <ExternalLink size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
