import { useState, useEffect } from 'react'
import { ArrowLeft, Users, FileText, Megaphone, BarChart3, PlusCircle, BookOpen, MessageSquare } from 'lucide-react'
import { Button, cn } from '../../../shared/ui'
import { EnrollmentView } from '../EnrollmentView'
import { QuizBuilder } from './QuizBuilder'
import { QuizTaker } from './QuizTaker'
import { CourseAnnouncements } from './CourseAnnouncements'
import { LectureResources } from './LectureResources'
import { CourseResources } from './CourseResources'
import { CourseDiscussion } from './CourseDiscussion'
import { TeacherAnalytics } from './TeacherAnalytics'
import { getCourseQuizzes } from '../services/quizService'
import { supabase } from '../../../lib/supabase'

/**
 * AdminCourseManager — Per-course management hub for admins/scholars.
 * Tabs: Enrollments, Quizzes, Announcements, Resources, Analytics
 */
export function AdminCourseManager({ course, userId, onBack, onEditCourse }) {
  const [tab, setTab] = useState('enrollments')
  const [quizzes, setQuizzes] = useState([])
  const [editingQuizId, setEditingQuizId] = useState(null)
  const [creatingQuiz, setCreatingQuiz] = useState(false)
  const [lectures, setLectures] = useState([])
  const [selectedLectureId, setSelectedLectureId] = useState(null)

  useEffect(() => {
    if (tab === 'quizzes') loadQuizzes()
    if (tab === 'resources') loadLectures()
  }, [tab])

  const loadQuizzes = async () => {
    const data = await getCourseQuizzes(course.id)
    setQuizzes(data)
  }

  const loadLectures = async () => {
    const { data } = await supabase
      .from('course_lectures')
      .select('id, title, position, course_sections:section_id(title)')
      .eq('course_id', course.id)
      .order('position')
    setLectures(data || [])
    if (data && data.length > 0 && !selectedLectureId) {
      setSelectedLectureId(data[0].id)
    }
  }

  const tabs = [
    { key: 'enrollments', label: 'Enrollments', icon: Users },
    { key: 'quizzes', label: 'Quizzes', icon: FileText },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'discussion', label: 'Discussion', icon: MessageSquare },
    { key: 'resources', label: 'Resources', icon: BookOpen },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-800 truncate">{course.title}</h1>
            <p className="text-xs text-gray-400">Course Management</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onEditCourse(course)}>Edit Course</Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 -mb-px">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                tab === key
                  ? 'text-primary-600 border-primary-500'
                  : 'text-neutral-500 hover:text-neutral-700 border-transparent'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {tab === 'enrollments' && (
          <EnrollmentView course={course} onBack={onBack} />
        )}

        {tab === 'quizzes' && (
          <div>
            {creatingQuiz || editingQuizId ? (
              <QuizBuilder
                courseId={course.id}
                quizId={editingQuizId}
                createdBy={userId}
                onComplete={() => { setCreatingQuiz(false); setEditingQuizId(null); loadQuizzes() }}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Course Quizzes</h2>
                  <Button variant="primary" size="sm" onClick={() => setCreatingQuiz(true)}>
                    <PlusCircle className="w-4 h-4 mr-1.5" /> Create Quiz
                  </Button>
                </div>

                {quizzes.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-3">No quizzes yet. Create one to assess your students.</p>
                    <Button variant="outline" size="sm" onClick={() => setCreatingQuiz(true)}>
                      <PlusCircle className="w-4 h-4 mr-1.5" /> Create First Quiz
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map(quiz => (
                      <div key={quiz.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">{quiz.title}</h3>
                          <p className="text-xs text-gray-400">
                            Passing: {quiz.passing_score}% ·{' '}
                            <span className={quiz.is_published ? 'text-green-600' : 'text-yellow-600'}>
                              {quiz.is_published ? '✓ Published' : '⏳ Draft'}
                            </span>
                            {' · '}
                            <span className="text-gray-500">
                              {quiz.section_id ? `📖 ${quiz.course_sections?.title || 'Section'}` : '📚 Entire Course'}
                            </span>
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setEditingQuizId(quiz.id)}>
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'announcements' && (
          <CourseAnnouncements courseId={course.id} isTeacher={true} userId={userId} />
        )}

        {tab === 'discussion' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Course Discussion</h2>
              <p className="text-sm text-gray-500">
                Join the conversation or moderate posts. You can remove any post as a moderator.
              </p>
            </div>
            <CourseDiscussion courseId={course.id} userId={userId} isModerator={true} />
          </div>
        )}

        {tab === 'resources' && (
          <div className="space-y-8">
            {/* Course-wide resources */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Course Resources</h2>
                <p className="text-sm text-gray-500">
                  Files or links shared with the whole course. Students see these in the course&apos;s <strong>Resources</strong> tab.
                </p>
              </div>
              <CourseResources courseId={course.id} isTeacher={true} userId={userId} />
            </div>

            {/* Per-lecture resources */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Lecture Resources</h2>
                <p className="text-sm text-gray-500">Attach resources (PDFs, links, files) to a specific lecture.</p>
              </div>

            {lectures.length === 0 ? (
              <p className="text-sm text-gray-400">No lectures in this course yet. Add lectures in the course editor first.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lecture list */}
                <div className="space-y-1">
                  {lectures.map(lecture => (
                    <button
                      key={lecture.id}
                      onClick={() => setSelectedLectureId(lecture.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        selectedLectureId === lecture.id
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <span className="text-xs text-gray-400 mr-2">{lecture.course_sections?.title} ·</span>
                      {lecture.title}
                    </button>
                  ))}
                </div>

                {/* Resources for selected lecture */}
                <div className="lg:col-span-2">
                  {selectedLectureId && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Resources for: {lectures.find(l => l.id === selectedLectureId)?.title}
                      </h3>
                      <LectureResources lectureId={selectedLectureId} isTeacher={true} />
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Course Analytics</h2>
            <TeacherAnalytics courseId={course.id} />
          </div>
        )}
      </div>
    </div>
  )
}
