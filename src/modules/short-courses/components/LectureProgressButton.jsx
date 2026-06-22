import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { markLectureComplete, unmarkLectureComplete } from '../services/progressService'

/**
 * LectureProgressButton — Mark/unmark a lecture as complete.
 * Shows a checkmark when completed, animates on toggle.
 */
export function LectureProgressButton({ courseId, lectureId, studentId, isCompleted, onToggle }) {
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(isCompleted)

  const handleToggle = async () => {
    if (loading || !studentId) return
    setLoading(true)

    try {
      if (completed) {
        const res = await unmarkLectureComplete(courseId, lectureId, studentId)
        if (res.ok) { setCompleted(false); onToggle?.(false) }
      } else {
        const res = await markLectureComplete(courseId, lectureId, studentId)
        if (res.ok) { setCompleted(true); onToggle?.(true) }
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <button disabled className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px]
        ${completed
          ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
          : 'bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-700 border border-gray-200'
        }`}
      aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
    >
      <AnimatePresence mode="wait">
        {completed ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <CheckCircle className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div key="circle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Circle className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
      <span>{completed ? 'Completed' : 'Mark Complete'}</span>
    </button>
  )
}
