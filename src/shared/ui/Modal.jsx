import { useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { cn } from './utils'

const sizeMap = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-[95vw] h-[92vh]',
}

/**
 * Universal Modal Dialog Component
 *
 * @param {object} props
 * @param {boolean} props.open - Controls visibility of the modal
 * @param {function} props.onClose - Triggered on close action (close button, escape, overlay)
 * @param {React.ReactNode} [props.title] - Modal title in standard header
 * @param {React.ReactNode} [props.description] - Subtitle or description in header
 * @param {React.ReactNode} props.children - Modal body content
 * @param {React.ReactNode} [props.footer] - Modal footer with action buttons
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'2xl'|'full'} [props.size='md'] - Max width size variant
 * @param {boolean} [props.closeButton=true] - Whether to show the top-right X close button
 * @param {boolean} [props.closeOnEscape=true] - Close on Escape key press
 * @param {boolean} [props.closeOnOverlayClick=true] - Close when clicking the backdrop
 * @param {boolean} [props.preventOverlayClose=false] - Force user to use explicit buttons
 * @param {boolean} [props.loading=false] - Shows loading overlay inside modal
 * @param {string} [props.className] - Container CSS classes
 * @param {string} [props.bodyClassName] - Body content CSS classes
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeButton = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  preventOverlayClose = false,
  loading = false,
  className,
  bodyClassName,
  ...props
}) {
  const contentRef = useRef(null)
  const triggerRef = useRef(null)
  const id = useId()
  const titleId = `modal-title-${id}`
  const descId = `modal-desc-${id}`

  // Track initial focused element to return focus when closed
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement
      // Prevent body scrolling when modal is active
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        const firstFocusable = contentRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        firstFocusable?.focus()
      }, 50)

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = originalOverflow
      }
    } else if (triggerRef.current) {
      triggerRef.current.focus?.()
    }
  }, [open])

  // Keyboard navigation & Focus Trap
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEscape && !preventOverlayClose) {
        e.preventDefault()
        onClose?.()
      }

      if (e.key === 'Tab') {
        const focusables = contentRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusables || focusables.length === 0) return

        const first = focusables[0]
        const last = focusables[focusables.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, closeOnEscape, preventOverlayClose, onClose])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && !preventOverlayClose) {
      onClose?.()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          onClick={handleOverlayClick}
          {...props}
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal Container */}
          <motion.div
            ref={contentRef}
            className={cn(
              'relative w-full bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] z-10',
              sizeMap[size] || sizeMap.md,
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
          >
            {/* Header (if title or closeButton) */}
            {(title || closeButton) && (
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-[#1a2e23] flex-shrink-0 bg-white dark:bg-[#0f1a14]">
                <div className="space-y-1 pr-4">
                  {title && (
                    <h2
                      id={titleId}
                      className="font-display font-semibold text-lg sm:text-xl text-neutral-900 dark:text-white leading-tight"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id={descId}
                      className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-normal"
                    >
                      {description}
                    </p>
                  )}
                </div>

                {closeButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#14221b] transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className={cn('p-6 overflow-y-auto flex-1 custom-scrollbar text-neutral-800 dark:text-neutral-200 text-sm', bodyClassName)}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-[#1a2e23] bg-neutral-50/60 dark:bg-[#0c1410]/80 flex-shrink-0">
                {footer}
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-[#0f1a14]/80 backdrop-blur-xs flex items-center justify-center z-20">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal
