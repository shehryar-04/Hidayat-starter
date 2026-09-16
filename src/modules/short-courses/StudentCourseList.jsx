import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../app/RoleProvider'
import { GraduationCap, Search, Signal, Landmark, Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { Button, Input, Badge, EmptyState, Spinner, CourseGridSkeleton } from '../../shared/ui'
import { Helmet } from 'react-helmet-async'
import { WhatsAppButton } from '../../shared/WhatsAppButton'
import { generateCourseSchema } from '../fatwa-platform/utils/structuredData'

export function StudentCourseList({ onSelectCourse }) {
  const { userId } = useRole()
  const [courses, setCourses] = useState([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set())
  const [pendingCourseIds, setPendingCourseIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [tab, setTab] = useState('all')
  const [categories, setCategories] = useState([])

  useEffect(() => { load() }, [userId])

  const load = async () => {
    setLoading(true)
    try {
      const { data: courseData, error: cErr } = await supabase
        .from('short_courses')
        .select(`id, title, subtitle, description, thumbnail_url, level,
                 category, language, is_free, fee, learning_objectives, tags, promo_video_url, requirements,
                 profiles:created_by(full_name)`)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      if (cErr) throw cErr
      setCourses(courseData || [])
      setCategories([...new Set((courseData || []).map(c => c.category).filter(Boolean))])

      if (userId) {
        const { data: studentRow } = await supabase.from('students').select('id').eq('profile_id', userId).single()
        if (studentRow) {
          const { data: enrollments } = await supabase
            .from('short_course_enrollments')
            .select('course_id, status')
            .eq('student_id', studentRow.id)
            .in('status', ['pending', 'active', 'completed'])
          const active = (enrollments || []).filter(e => e.status === 'active' || e.status === 'completed')
          const pending = (enrollments || []).filter(e => e.status === 'pending')
          setEnrolledCourseIds(new Set(active.map(e => e.course_id)))
          setPendingCourseIds(new Set(pending.map(e => e.course_id)))
        }
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const filtered = courses.filter(c => {
    if (tab === 'enrolled' && !enrolledCourseIds.has(c.id)) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description?.toLowerCase().includes(search.toLowerCase())) return false
    if (levelFilter && c.level !== levelFilter) return false
    if (categoryFilter && c.category !== categoryFilter) return false
    return true
  })

  const courseSchemas = useMemo(() => {
    return (filtered || []).map(course => generateCourseSchema({
      title: course.title,
      description: course.description,
      duration: course.level || 'Self-paced',
      schedule: 'Weekly',
      url: `https://hidayat.pk/short-courses`
    }))
  }, [filtered])

  if (loading) return (
    <div className="py-12">
      <CourseGridSkeleton count={6} />
    </div>
  )

  return (
    <div className="space-y-6">
      <Helmet>
        {courseSchemas.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl p-4 shadow-xs transition-colors space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => { setCategoryFilter(''); setTab('all') }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                !categoryFilter && tab === 'all'
                  ? 'bg-primary-500 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-[#14221b] border border-neutral-200/60 dark:border-[#1a2e23] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              All Courses
            </button>
            {enrolledCourseIds.size > 0 && (
              <button
                onClick={() => { setTab('enrolled'); setCategoryFilter('') }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  tab === 'enrolled'
                    ? 'bg-primary-500 text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-[#14221b] border border-neutral-200/60 dark:border-[#1a2e23] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                My Enrolled ({enrolledCourseIds.size})
              </button>
            )}
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setTab('all') }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-primary-500 text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-[#14221b] border border-neutral-200/60 dark:border-[#1a2e23] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Level Filter dropdown */}
          <div className="flex items-center gap-2.5">
            <select
              className="bg-neutral-50 dark:bg-[#14221b] border border-neutral-200/80 dark:border-[#1a2e23] rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-primary-500 py-2 px-3 outline-none"
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
            >
              <option value="">All Levels</option>
              {['Beginner', 'Intermediate', 'Advanced', 'All levels'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            className="pl-10"
            placeholder="Search courses by topic, teacher, or keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-12">
          <EmptyState
            icon={GraduationCap}
            title={tab === 'enrolled' ? "No enrolled courses" : courses.length === 0 ? 'No courses available' : 'No matches'}
            description={tab === 'enrolled' ? "You haven't enrolled in any courses yet." : courses.length === 0 ? 'No courses available yet.' : 'No courses match your filters.'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(course => {
            const isEnrolled = enrolledCourseIds.has(course.id)
            const isPending = pendingCourseIds.has(course.id)

            return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className="group bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] shadow-xs hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-[#112018] dark:to-[#09140e] overflow-hidden border-b border-neutral-100 dark:border-[#1a2e23] flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-neutral-200/50 dark:border-white/10 flex items-center justify-center text-3xl shadow-sm">
                      🎓
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    {course.category ? (
                      <span className="backdrop-blur-md bg-white/90 dark:bg-[#0f1a14]/90 px-2.5 py-1 rounded-full text-[10px] font-bold text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-[#1a2e23] shadow-xs uppercase tracking-wider">
                        {course.category}
                      </span>
                    ) : <span />}

                    {isEnrolled ? (
                      <Badge variant="success" dot>Enrolled</Badge>
                    ) : isPending ? (
                      <Badge variant="warning" dot>Pending</Badge>
                    ) : course.is_free ? (
                      <Badge variant="primary">Free</Badge>
                    ) : (
                      <span className="backdrop-blur-md bg-white/90 dark:bg-[#0f1a14]/90 px-2.5 py-1 rounded-full text-[11px] font-bold text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-[#1a2e23] shadow-xs">
                        ${course.fee}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-display font-bold text-neutral-900 dark:text-neutral-50 text-base leading-snug mb-1.5 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 flex-1 leading-relaxed mb-3">
                    {course.description || 'Interactive course curriculum with verified certificate.'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-[#1a2e23] text-xs text-neutral-500 dark:text-neutral-400">
                    {course.level && (
                      <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                        <Signal className="w-3.5 h-3.5 text-primary-500 dark:text-emerald-400" />
                        <span>{course.level}</span>
                      </div>
                    )}
                    {course.language && (
                      <span>{course.language}</span>
                    )}
                    <span className="font-bold text-primary-600 dark:text-emerald-400">
                      {course.is_free ? 'Free' : `$${course.fee}`}
                    </span>
                  </div>

                  {/* WhatsApp CTA Button if not enrolled */}
                  {!isEnrolled && !isPending && (
                    <div className="pt-3">
                      <WhatsAppButton
                        message={`Hi, I'm interested in enrolling in ${course.title}`}
                        label="Enroll via WhatsApp"
                        className="w-full justify-center text-xs py-2 px-3 font-semibold shadow-none border border-[#25D366]/20"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
