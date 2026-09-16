import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from './utils'

const placementMap = {
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    classes: 'inset-y-0 right-0 max-w-md w-full',
  },
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    classes: 'inset-y-0 left-0 max-w-md w-full',
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    classes: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl',
  },
}

/**
 * Reusable Drawer / Sheet Component
 * Theme-aware in both Light and Dark modes.
 *
 * @param {object} props
 * @param {boolean} props.open - Controls visibility
 * @param {function} props.onClose - Triggered on close
 * @param {'right'|'left'|'bottom'} [props.placement='right'] - Drawer position
 * @param {string} [props.title] - Drawer header title
 * @param {string} [props.description] - Drawer subtitle
 * @param {React.ReactNode} props.children - Drawer body
 * @param {React.ReactNode} [props.footer] - Action buttons in footer
 */
export function Drawer({
  open,
  onClose,
  placement = 'right',
  title,
  description,
  children,
  footer,
  className,
}) {
  const contentRef = useRef(null)
  const config = placementMap[placement] || placementMap.right

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer Sheet */}
          <motion.div
            ref={contentRef}
            initial={config.initial}
            animate={config.animate}
            exit={config.exit}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            className={cn(
              'fixed bg-white dark:bg-[#0f1a14] border-neutral-200/90 dark:border-[#1a2e23] shadow-2xl flex flex-col z-10',
              config.classes,
              className
            )}
          >
            {/* Header */}
            {(title || onClose) && (
              <div className="flex items-start justify-between px-6 py-4 border-b border-neutral-100 dark:border-[#1a2e23] flex-shrink-0 bg-white dark:bg-[#0f1a14]">
                <div className="space-y-0.5 pr-4">
                  {title && (
                    <h3 className="font-display font-semibold text-lg text-neutral-900 dark:text-white">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#14221b] transition-colors cursor-pointer"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-sm text-neutral-800 dark:text-neutral-200">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-4 border-t border-neutral-100 dark:border-[#1a2e23] bg-neutral-50/60 dark:bg-[#0c1410]/80 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Drawer
