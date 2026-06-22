import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Plus, Send } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Button, Input, Textarea, Spinner, EmptyState } from '../../../shared/ui'

/**
 * CourseAnnouncements — Teachers post, students view.
 */
export function CourseAnnouncements({ courseId, isTeacher = false, userId }) {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { load() }, [courseId])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('course_announcements')
      .select('id, title, message, created_at, profiles:created_by(full_name)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) { setError('Title and message required'); return }
    setPosting(true); setError(null)
    try {
      const { error: err } = await supabase.from('course_announcements').insert({
        course_id: courseId,
        title: title.trim(),
        message: message.trim(),
        created_by: userId,
      })
      if (err) throw err
      setTitle(''); setMessage(''); setShowForm(false)
      await load()
    } catch (err) { setError(err.message) }
    finally { setPosting(false) }
  }

  if (loading) return <div className="py-8 flex justify-center"><Spinner /></div>

  return (
    <div className="space-y-4">
      {/* Teacher: Post Announcement */}
      {isTeacher && (
        <div className="mb-4">
          {showForm ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" />
              <Textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Write your announcement..." rows={3} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handlePost} disabled={posting}>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> {posting ? 'Posting...' : 'Post'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> New Announcement
            </Button>
          )}
        </div>
      )}

      {/* Announcement List */}
      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="No announcements for this course yet." />
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="w-4 h-4 text-primary-500" />
                <h3 className="text-sm font-semibold text-gray-800">{a.title}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">{a.message}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{a.profiles?.full_name || 'Instructor'}</span>
                <span>·</span>
                <span>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
