import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, CheckCircle, XCircle, ChevronDown, ChevronUp, Award, Clock, RotateCcw } from 'lucide-react'
import { Button, Spinner, Badge } from '../../../shared/ui'
import { getStudentAttempts, getAttemptDetails } from '../services/quizService'

/**
 * QuizAttemptHistory — Shows a student's past quiz attempts with
 * score history and correct/incorrect answer breakdown.
 */
export function QuizAttemptHistory({ quizId, studentId, quizTitle, passingScore = 70 }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedAttempt, setExpandedAttempt] = useState(null)
  const [details, setDetails] = useState({})
  const [loadingDetails, setLoadingDetails] = useState(null)

  useEffect(() => {
    if (quizId && studentId) load()
  }, [quizId, studentId])

  const load = async () => {
    setLoading(true)
    const data = await getStudentAttempts(quizId, studentId)
    setAttempts(data)
    setLoading(false)
  }

  const toggleExpand = async (attemptId) => {
    if (expandedAttempt === attemptId) {
      setExpandedAttempt(null)
      return
    }

    setExpandedAttempt(attemptId)

    if (!details[attemptId]) {
      setLoadingDetails(attemptId)
      const detail = await getAttemptDetails(attemptId)
      setDetails(prev => ({ ...prev, [attemptId]: detail }))
      setLoadingDetails(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Spinner size="sm" />
        <span className="text-sm text-gray-500">Loading attempt history...</span>
      </div>
    )
  }

  if (attempts.length === 0) return null

  const bestScore = Math.max(...attempts.map(a => a.percentage || 0))
  const totalAttempts = attempts.length
  const passedAny = attempts.some(a => a.passed)

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <History size={16} className="text-gray-400" />
          Your Attempts ({totalAttempts})
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Best: </span>
          <Badge className={`text-xs ${bestScore >= passingScore ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {bestScore}%
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {attempts.map((attempt, index) => (
          <div key={attempt.id} className="border border-gray-100 rounded-lg bg-white overflow-hidden">
            {/* Attempt summary row */}
            <button
              onClick={() => toggleExpand(attempt.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  attempt.passed ? 'bg-green-100' : 'bg-red-50'
                }`}>
                  {attempt.passed
                    ? <CheckCircle size={16} className="text-green-600" />
                    : <XCircle size={16} className="text-red-400" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Attempt #{totalAttempts - index}
                    {index === 0 && <span className="text-xs text-gray-400 ml-2">(latest)</span>}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(attempt.submitted_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className={`text-lg font-bold ${attempt.passed ? 'text-green-600' : 'text-red-500'}`}>
                    {attempt.percentage}%
                  </span>
                  <p className="text-[10px] text-gray-400">
                    {attempt.passed ? 'PASSED' : 'FAILED'}
                  </p>
                </div>
                {expandedAttempt === attempt.id
                  ? <ChevronUp size={16} className="text-gray-400" />
                  : <ChevronDown size={16} className="text-gray-400" />
                }
              </div>
            </button>

            {/* Expanded detail — answer breakdown */}
            <AnimatePresence>
              {expandedAttempt === attempt.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                    {loadingDetails === attempt.id ? (
                      <div className="flex items-center gap-2 py-4">
                        <Spinner size="sm" />
                        <span className="text-xs text-gray-400">Loading answers...</span>
                      </div>
                    ) : details[attempt.id]?.answers ? (
                      <div className="space-y-3 mt-2">
                        {details[attempt.id].answers.map((ans, qi) => (
                          <div
                            key={ans.id}
                            className={`rounded-lg p-3 ${
                              ans.is_correct ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                ans.is_correct ? 'bg-green-500' : 'bg-red-400'
                              }`}>
                                {ans.is_correct
                                  ? <CheckCircle size={12} className="text-white" />
                                  : <XCircle size={12} className="text-white" />
                                }
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">
                                  Q{qi + 1}: {ans.quiz_questions?.question_text || 'Question'}
                                </p>
                                <p className="text-xs mt-1">
                                  <span className="text-gray-500">Your answer: </span>
                                  <span className={ans.is_correct ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                    {ans.quiz_options?.option_text || 'No answer'}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {ans.points_earned}/{ans.quiz_questions?.points || 1} points
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Score summary */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                          <span className="text-xs text-gray-500">
                            Total: {details[attempt.id].score} / {details[attempt.id].answers.reduce((sum, a) => sum + (a.quiz_questions?.points || 1), 0)} points
                          </span>
                          <Badge className={`text-xs ${attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {attempt.percentage}% — {attempt.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 py-2">Could not load answer details.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
