import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ExternalLink, Trash2, AlertTriangle } from 'lucide-react'
import { useLocalSavedFatwas } from '../hooks/useLocalSavedFatwas'
import SaveFatwaButton from '../components/SaveFatwaButton'
import { Button, EmptyState, PageHeader, Badge, ConfirmDialog } from '../../../shared/ui'

/**
 * SavedFatwasPage — Shows all locally-saved fatwas (stored in browser).
 */
export default function SavedFatwasPage() {
  const { savedFatwas, removeFatwa, isSaved, toggleSave, clearAll, count } = useLocalSavedFatwas()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Fatwas"
        subtitle="Your locally saved rulings and verdicts. These are stored in your browser session for quick offline reference."
      />

      {/* Info banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          Saved fatwas are stored in your browser's local storage. They will persist on this device until you clear your browsing data.
        </p>
      </div>

      {count > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">{count} saved fatwa{count !== 1 ? 's' : ''}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
          </Button>
        </div>
      )}

      {count === 0 ? (
        <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-12 shadow-xs">
          <EmptyState
            title="No saved fatwas"
            description="Tap the heart icon on any fatwa to bookmark it here for quick reference."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {savedFatwas.map((fatwa) => (
            <div
              key={fatwa.id}
              className="flex items-center gap-3.5 p-4 bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs transition-colors group"
            >
              <SaveFatwaButton
                isSaved={true}
                onToggle={() => removeFatwa(fatwa.id)}
                size="sm"
              />

              <div className="flex-1 min-w-0">
                <Link
                  to={`/fatwas/${fatwa.slug || fatwa.id}`}
                  className="text-sm font-display font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-emerald-400 line-clamp-1 transition-colors"
                >
                  {fatwa.title}
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {fatwa.category_1 && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {[fatwa.category_1, fatwa.category_2].filter(Boolean).join(' > ')}
                    </span>
                  )}
                  {fatwa.dar_ul_ifta && (
                    <span className="text-xs text-neutral-400">• {fatwa.dar_ul_ifta}</span>
                  )}
                  <span className="text-[10px] text-neutral-400 ml-auto font-mono">
                    {new Date(fatwa.saved_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Link
                to={`/fatwas/${fatwa.slug || fatwa.id}`}
                className="text-neutral-400 hover:text-primary-600 dark:hover:text-emerald-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="View fatwa"
              >
                <ExternalLink size={15} />
              </Link>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearAll()
          setShowClearConfirm(false)
        }}
        title="Clear All Saved Fatwas"
        message="Are you sure you want to remove all saved fatwas? This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
      />
    </div>
  )
}
