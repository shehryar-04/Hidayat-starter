import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from './utils'

const sizeMap = { sm: 'max-w-[400px]', md: 'max-w-[560px]', lg: 'max-w-[720px]' }

/**
 * Animated modal dialog with focus trap, backdrop, and size variants.
 * @param {object} props
 * @param {boolean} props.open - Controls visibility
 * @param {function} props.onClose - Called when modal should close
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Maximum width variant
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <Modal open={isOpen} onClose={() => setOpen(false)} size="md">Content</Modal>
 */
export function Modal({ open, onClose, size = 'md', children, className }) {
  const contentRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement
      const timer = setTimeout(() => {
        const first = contentRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        first?.focus()
      }, 100)
      return () => clearTimeout(timer)
    } else if (triggerRef.current) {
      triggerRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const focusable = contentRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
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
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={contentRef}
            className={cn('relative w-full mx-4 bg-white rounded-xl shadow-xl p-6', sizeMap[size], className)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
