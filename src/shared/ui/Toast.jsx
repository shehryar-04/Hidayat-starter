import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const ICON_COLORS = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}

const MAX_TOASTS = 4
const DEFAULT_DURATION = 4000

/**
 * ToastProvider — Wraps the app and provides toast functionality via context.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counterRef = useRef(0)

  const addToast = useCallback(({ type = 'info', title, message, duration = DEFAULT_DURATION }) => {
    const id = ++counterRef.current

    setToasts(prev => {
      const next = [...prev, { id, type, title, message, duration }]
      // Keep only the most recent MAX_TOASTS
      return next.slice(-MAX_TOASTS)
    })

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useMemo(() => ({
    success: (title, message, duration) => addToast({ type: 'success', title, message, duration }),
    error: (title, message, duration) => addToast({ type: 'error', title, message, duration }),
    warning: (title, message, duration) => addToast({ type: 'warning', title, message, duration }),
    info: (title, message, duration) => addToast({ type: 'info', title, message, duration }),
  }), [addToast])

  // Expose via a stable object
  const value = { toast, addToast, dismissToast }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />,
        document.body
      )}
    </ToastContext.Provider>
  )
}

/**
 * useToast — Hook to access toast functions.
 *
 * @example
 * const { toast } = useToast()
 * toast.success('Saved!', 'Your changes have been saved.')
 * toast.error('Failed', 'Could not save. Please try again.')
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Return a no-op toast if used outside provider (prevents crashes)
    return {
      toast: {
        success: () => {},
        error: () => {},
        warning: () => {},
        info: () => {},
      },
      addToast: () => {},
      dismissToast: () => {},
    }
  }
  return ctx
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast: t, onDismiss }) {
  const Icon = ICONS[t.type] || Info

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${COLORS[t.type]}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ICON_COLORS[t.type]}`} />
      <div className="flex-1 min-w-0">
        {t.title && (
          <p className="text-sm font-semibold leading-tight">{t.title}</p>
        )}
        {t.message && (
          <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{t.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 opacity-60" />
      </button>
    </motion.div>
  )
}
