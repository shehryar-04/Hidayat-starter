import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, GripVertical, Eye, Save } from 'lucide-react'
import { Button, Input, Label, Spinner } from '../../../shared/ui'
import { supabase } from '../../../lib/supabase'
import { createQuiz, addQuestion, deleteQuestion, getQuizWithQuestions, publishQuiz, updateQuiz, deleteQuiz } from '../services/quizService'

/**
 * QuizBuilder — Teachers create MCQ quizzes.
 * Can attach to a specific section (module) or to the entire course.
 */
export function QuizBuilder({ courseId, quizId = null, createdBy, onComplete }) {
  const [title, setTitle] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [sectionId, setSectionId] = useState('') // '' = entire course, uuid = specific section
  const [sections, setSections] = useState([])
  const [questions, setQuestions] = useState([])
  const [savedQuizId, setSavedQuizId] = useState(quizId)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Load course sections for the dropdown
  useEffect(() => {
    loadSections()
  }, [courseId])

  const loadSections = async () => {
    const { data } = await supabase
      .from('course_sections')
      .select('id, title, position')
      .eq('course_id', courseId)
      .order('position')
    setSections(data || [])
  }

  // Load existing quiz if editing
  useEffect(() => {
    if (quizId) loadQuiz()
  }, [quizId])

  const loadQuiz = async () => {
    setLoading(true)
    try {
      const quiz = await getQuizWithQuestions(quizId)
      if (quiz) {
        setTitle(quiz.title)
        setPassingScore(quiz.passing_score)
        setSectionId(quiz.section_id || '')
        setQuestions(quiz.questions.map(q => ({
          id: q.id,
          text: q.question_text,
          options: q.options.map(o => o.option_text),
          correctIndex: q.options.findIndex(o => o.is_correct),
          points: q.points,
          saved: true,
        })))
        setSavedQuizId(quiz.id)
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const addNewQuestion = () => {
    setQuestions([...questions, {
      id: null,
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      points: 1,
      saved: false,
    }])
  }

  const updateQuestion = (index, field, value) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value, saved: false }
    setQuestions(updated)
  }

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions]
    const opts = [...updated[qIndex].options]
    opts[oIndex] = value
    updated[qIndex] = { ...updated[qIndex], options: opts, saved: false }
    setQuestions(updated)
  }

  const removeQuestion = async (index) => {
    const q = questions[index]
    if (q.id) {
      try { await deleteQuestion(q.id) } catch {}
    }
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Quiz title is required'); return }
    setSaving(true); setError(null); setSuccess(null)

    try {
      // Create quiz if not yet saved
      let qId = savedQuizId
      if (!qId) {
        const quiz = await createQuiz(courseId, title, passingScore, createdBy, sectionId || null)
        qId = quiz.id
        setSavedQuizId(qId)
      } else {
        await updateQuiz(qId, { title, passing_score: passingScore, section_id: sectionId || null })
      }

      // Save unsaved questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        if (q.saved) continue
        if (!q.text.trim()) continue
        if (q.options.some(o => !o.trim())) continue

        // Delete old version if exists
        if (q.id) await deleteQuestion(q.id)

        const newQ = await addQuestion(qId, q.text, q.options, q.correctIndex, q.points)
        questions[i] = { ...q, id: newQ.id, saved: true }
      }

      setQuestions([...questions])
      setSuccess('Quiz saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handlePublish = async () => {
    if (!savedQuizId) { setError('Save the quiz first'); return }
    if (questions.length === 0) { setError('Add at least one question'); return }
    setSaving(true)
    try {
      await publishQuiz(savedQuizId)
      setSuccess('Quiz published!')
      setTimeout(() => onComplete?.(), 1500)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!savedQuizId) return
    if (!window.confirm('Delete this quiz permanently?')) return
    try {
      await deleteQuiz(savedQuizId)
      onComplete?.()
    } catch (err) { setError(err.message) }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">{quizId ? 'Edit Quiz' : 'Create Quiz'}</h2>
        <div className="flex gap-2">
          {savedQuizId && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>Delete Quiz</Button>
          )}
          <Button variant="outline" size="sm" onClick={onComplete}>Cancel</Button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm mb-4">{success}</div>}

      {/* Quiz Meta */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-4">
        <div className="space-y-2">
          <Label>Quiz Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1 Assessment" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Passing Score (%)</Label>
            <Input type="number" min="0" max="100" value={passingScore}
              onChange={e => setPassingScore(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Attach To</Label>
            <select
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">📚 Entire Course (Final Quiz)</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>📖 Section: {s.title}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              {sectionId ? 'This quiz will appear in the selected section/module.' : 'This quiz covers the entire course content.'}
            </p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        <AnimatePresence>
          {questions.map((q, qi) => (
            <motion.div
              key={qi}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                    Q{qi + 1}
                  </span>
                  <span className="text-xs text-gray-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                </div>
                <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Input
                value={q.text}
                onChange={e => updateQuestion(qi, 'text', e.target.value)}
                placeholder="Enter question..."
                className="mb-4 font-medium"
              />

              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(qi, 'correctIndex', oi)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${q.correctIndex === oi
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                        }`}
                      title={q.correctIndex === oi ? 'Correct answer' : 'Mark as correct'}
                    >
                      {q.correctIndex === oi && <Check className="w-3 h-3" />}
                    </button>
                    <Input
                      value={opt}
                      onChange={e => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className={q.correctIndex === oi ? 'border-green-300 bg-green-50' : ''}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Click the circle to mark the correct answer.</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Question */}
      <Button variant="outline" className="w-full mb-6" onClick={addNewQuestion}>
        <Plus className="w-4 h-4 mr-2" /> Add Question
      </Button>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleSave} disabled={saving} className="flex-1">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button variant="primary" onClick={handlePublish} disabled={saving || questions.length === 0} className="flex-1">
          <Eye className="w-4 h-4 mr-2" /> Publish Quiz
        </Button>
      </div>
    </div>
  )
}
