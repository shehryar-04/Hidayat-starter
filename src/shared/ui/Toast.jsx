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
  success: 'bg-emerald-50 dark:bg-[#091b12] border-emerald-200/80 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200',
  error: 'bg-red-50 dark:bg-[#1f0d0d] border-red-200/80 dark:border-red-900/60 text-red-900 dark:text-red-200',
  warning: 'bg-amber-50 dark:bg-[#1f1707] border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200',
  info: 'bg-blue-50 dark:bg-[#0c1626] border-blue-200/80 dark:border-blue-900/60 text-blue-900 dark:text-blue-200',
}

const ICON_COLORS = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
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
      return next.slice(-MAX_TOASTS)
    })

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

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
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
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full"
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
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl backdrop-blur-md transition-colors ${COLORS[t.type]}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ICON_COLORS[t.type]}`} />
      <div className="flex-1 min-w-0">
        {t.title && (
          <p className="text-sm font-semibold leading-tight">{t.title}</p>
        )}
        {t.message && (
          <p className="text-xs mt-1 opacity-90 leading-relaxed">{t.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 opacity-70 hover:opacity-100" />
      </button>
    </motion.div>
  )
}

export default ToastProvider
