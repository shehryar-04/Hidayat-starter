import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Award, RotateCcw } from 'lucide-react'
import { Button, Spinner } from '../../../shared/ui'
import { getQuizForStudent, submitQuizAttempt, getStudentAttempts } from '../services/quizService'

/**
 * QuizTaker — Student attempts a quiz.
 * Shows questions one at a time or all at once, auto-grades on submit.
 */
export function QuizTaker({ quizId, studentId, onComplete }) {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [previousAttempts, setPreviousAttempts] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  const loadQuiz = async () => {
    setLoading(true)
    try {
      const [quizData, attempts] = await Promise.all([
        getQuizForStudent(quizId),
        getStudentAttempts(quizId, studentId),
      ])
      setQuiz(quizData)
      setPreviousAttempts(attempts)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const selectAnswer = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmit = async () => {
    if (!quiz) return
    const unanswered = quiz.questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      if (!window.confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) return
    }

    setSubmitting(true); setError(null)
    try {
      const res = await submitQuizAttempt(quizId, studentId, answers)
      setResult(res)
    } catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  const handleRetry = () => {
    setResult(null)
    setAnswers({})
    loadQuiz()
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!quiz) return <div className="text-center py-8 text-gray-500">Quiz not found.</div>

  // ─── Results View ──────────────────────────────────────────
  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto px-4 py-8"
      >
        <div className={`rounded-2xl p-8 text-center ${result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="mb-4">
            {result.passed
              ? <Award className="w-16 h-16 text-green-500 mx-auto" />
              : <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            }
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
            {result.passed ? 'Congratulations! You Passed!' : 'Not Quite — Try Again'}
          </h2>
          <div className="text-4xl font-bold my-4">
            <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
              {result.percentage}%
            </span>
          </div>
          <p className="text-gray-600 mb-2">
            Score: {result.score} / {result.totalPoints} points
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Passing score: {quiz.passing_score}%
          </p>

          <div className="flex gap-3 justify-center">
            {!result.passed && (
              <Button variant="primary" onClick={handleRetry}>
                <RotateCcw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            )}
            <Button variant="outline" onClick={onComplete}>
              Back to Course
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── Quiz View ─────────────────────────────────────────────
  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz.questions.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">{quiz.title}</h2>
        <p className="text-sm text-gray-500">
          {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} · Passing score: {quiz.passing_score}%
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-500">{answeredCount}/{totalQuestions}</span>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

      {/* Previous attempts */}
      {previousAttempts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-700">
            You have {previousAttempts.length} previous attempt(s). Best: {Math.max(...previousAttempts.map(a => a.percentage || 0))}%
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6 mb-8">
        {quiz.questions.map((question, qi) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.03 }}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="text-xs font-bold text-white bg-primary-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                {qi + 1}
              </span>
              <p className="text-sm font-medium text-gray-800 leading-relaxed">{question.question_text}</p>
            </div>

            <div className="space-y-2 ml-9">
              {question.options.map(option => {
                const isSelected = answers[question.id] === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => selectAnswer(question.id, option.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all
                      ${isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium ring-1 ring-primary-200'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      {option.option_text}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Submit */}
      <div className="sticky bottom-4">
        <Button
          variant="primary"
          className="w-full py-4 text-base font-bold shadow-lg"
          onClick={handleSubmit}
          disabled={submitting}
          loading={submitting}
        >
          {submitting ? 'Submitting...' : `Submit Quiz (${answeredCount}/${totalQuestions} answered)`}
        </Button>
      </div>
    </div>
  )
}
