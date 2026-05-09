import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../app/RoleProvider'

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

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

  if (loading) return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading courses…</div>

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 space-y-4 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-white rounded-full text-[10px] sm:text-label-sm uppercase tracking-widest">
              <Icon name="school" className="text-[14px] sm:text-[16px]" />
              Specialized Learning
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-headline-xl text-primary leading-tight">Short Courses </h1>
            <p className="text-sm sm:text-body-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
              Deepen your understanding of Islamic sciences through our curated, short-term modules.
            </p>
          </div>
          <div className="hidden lg:block w-1/3 aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white bg-primary flex-shrink-0">
           <img src="/assets/short-courses.png" alt="Short Courses" className="absolute inset-0 w-full h-full object-cover opacity-100" />
          </div>
        </div>
      </section>

      {/* Sticky filter bar */}
      <section className="sticky top-[57px] sm:top-[65px] z-40 bg-white/90 backdrop-blur-md border-y border-outline">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Category pills — horizontal scroll on mobile */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 -mx-1 px-1">
            <button onClick={() => { setCategoryFilter(''); setTab('all') }}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-serif text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                !categoryFilter && tab === 'all' ? 'bg-primary text-white' : 'bg-white border border-outline text-slate-600 hover:border-primary hover:text-primary'
              }`}>
              All Courses
            </button>
            {enrolledCourseIds.size > 0 && (
              <button onClick={() => { setTab('enrolled'); setCategoryFilter('') }}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-serif text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  tab === 'enrolled' ? 'bg-primary text-white' : 'bg-white border border-outline text-slate-600 hover:border-primary hover:text-primary'
                }`}>
                My Courses ({enrolledCourseIds.size})
              </button>
            )}
            {categories.map(cat => (
              <button key={cat} onClick={() => { setCategoryFilter(cat); setTab('all') }}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-serif text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  categoryFilter === cat ? 'bg-primary text-white' : 'bg-white border border-outline text-slate-600 hover:border-primary hover:text-primary'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Level filter */}
          <select className="bg-white border-outline rounded-lg text-xs sm:text-label-sm text-slate-600 focus:ring-primary focus:border-primary py-1.5 sm:py-2 px-2 sm:px-3 w-full sm:w-auto"
            value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">Level: All</option>
            {['Beginner', 'Intermediate', 'Advanced', 'All levels'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </section>

      {/* Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8">
        <div className="relative max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] sm:text-[20px]" />
          <input className="pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-white border border-outline rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary w-full transition-all"
            placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </section>

      {/* Course Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {error && <div className="alert-error mb-6 text-sm">{error}</div>}

        {filtered.length === 0 ? (
          <div className="text-center py-16 sm:py-20 text-slate-400">
            <Icon name="school" className="text-5xl sm:text-6xl text-slate-200 mb-4 block mx-auto" />
            <p className="text-xs sm:text-sm">{tab === 'enrolled' ? "You haven't enrolled in any courses yet." : courses.length === 0 ? 'No courses available yet.' : 'No courses match your filters.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filtered.map(course => {
              const isEnrolled = enrolledCourseIds.has(course.id)
              const isPending = pendingCourseIds.has(course.id)
              return (
                <div key={course.id} onClick={() => onSelectCourse(course)}
                  className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-outline cursor-pointer">
                  {/* Thumbnail */}
                  <div className="relative h-36 sm:h-48 overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center">
                        <Icon name="school" className="text-white/30 text-4xl sm:text-6xl" />
                      </div>
                    )}
                    {course.category && (
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-secondary text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest">
                        {course.category}
                      </div>
                    )}
                    {isEnrolled && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-primary text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow">✓ Enrolled</div>
                    )}
                    {isPending && !isEnrolled && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-yellow-500 text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow">⏳ Pending</div>
                    )}
                    {course.is_free && !isEnrolled && !isPending && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-secondary text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow">FREE</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6 lg:p-8 space-y-2 sm:space-y-4">
                    <h3 className="font-serif text-base sm:text-lg lg:text-headline-md text-primary group-hover:text-secondary transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs sm:text-sm lg:text-body-md text-slate-500 line-clamp-2">{course.description}</p>

                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-background text-xs sm:text-sm">
                      {course.level && (
                        <div className="flex items-center gap-1 sm:gap-2 text-slate-400">
                          <Icon name="signal_cellular_alt" className="text-[14px] sm:text-[18px]" />
                          <span className="hidden sm:inline">{course.level}</span>
                          <span className="sm:hidden text-[10px]">{course.level}</span>
                        </div>
                      )}
                      {course.language && (
                        <span className="text-slate-400 hidden sm:inline">{course.language}</span>
                      )}
                      <span className={`text-xs sm:text-sm font-bold ml-auto ${course.is_free ? 'text-secondary' : 'text-primary'}`}>
                        {course.is_free ? 'Free' : `$${course.fee}`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-16 sm:mb-24">
        <div className="bg-primary text-white rounded-2xl sm:rounded-[40px] p-6 sm:p-12 lg:p-20 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4 sm:space-y-8">
            <h2 className="font-serif text-xl sm:text-2xl lg:text-headline-lg">Stay Informed</h2>
            <p className="text-sm sm:text-body-lg text-white/70">Get notified when we launch new specialized courses and academic seminars.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 sm:px-6 py-3 sm:py-4 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none placeholder:text-white/40 text-white text-sm"
                placeholder="Your email address" type="email" />
              <button className="bg-secondary text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl font-serif font-bold hover:bg-secondary/90 transition-all text-sm sm:text-base">Subscribe</button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4 scale-100 sm:scale-150 hidden sm:block">
            <Icon name="mosque" className="text-[150px] sm:text-[300px]" />
          </div>
        </div>
      </section>
    </div>
  )
}
