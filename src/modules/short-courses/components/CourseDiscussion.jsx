import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Plus, Send, Trash2, CornerDownRight,
  ChevronDown, ChevronUp, User,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Button, Input, Textarea, Spinner, EmptyState } from '../../../shared/ui'

/**
 * CourseDiscussion — a lightweight per-course forum.
 *
 * Students (and staff) can start discussion threads and reply to them.
 * Authors can delete their own posts; moderators (admin/scholar/mufti)
 * can delete any post.
 *
 * Backed by the `course_discussions` table (migration
 * 20240301000004_course_discussions.sql). Degrades to an empty state if
 * the table has not been migrated yet.
 *
 * @param {{ courseId: string, userId?: string, isModerator?: boolean }} props
 */
export function CourseDiscussion({ courseId, userId, isModerator = false }) {
  const [threads, setThreads] = useState([])
  const [replies, setReplies] = useState({}) // threadId -> array
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('course_discussions')
      .select('id, parent_id, title, body, created_at, author_id, profiles:author_id(full_name)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })

    if (err) {
      console.warn('[CourseDiscussion] load failed:', err.message)
      setThreads([])
      setReplies({})
      setLoading(false)
      return
    }

    const rows = data || []
    const topLevel = rows
      .filter((r) => !r.parent_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const byParent = {}
    for (const r of rows) {
      if (r.parent_id) {
        ;(byParent[r.parent_id] ||= []).push(r)
      }
    }
    setThreads(topLevel)
    setReplies(byParent)
    setLoading(false)
  }, [courseId])

  useEffect(() => { if (courseId) load() }, [courseId, load])

  const handleCreateThread = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Please add both a title and a message.')
      return
    }
    setPosting(true); setError(null)
    try {
      const { error: err } = await supabase.from('course_discussions').insert({
        course_id: courseId,
        parent_id: null,
        author_id: userId,
        title: title.trim(),
        body: body.trim(),
      })
      if (err) throw err
      setTitle(''); setBody(''); setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (id, isThread) => {
    const { error: err } = await supabase.from('course_discussions').delete().eq('id', id)
    if (err) return
    if (isThread) {
      setThreads((t) => t.filter((x) => x.id !== id))
    } else {
      await load()
    }
  }

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  if (loading) {
    return <div className="py-8 flex justify-center"><Spinner /></div>
  }

  return (
    <div className="space-y-4">
      {/* Start a discussion */}
      <div>
        {showForm ? (
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Discussion title (e.g. Question about Lesson 3)"
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What would you like to discuss?"
              rows={3}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleCreateThread} disabled={posting}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {posting ? 'Posting…' : 'Post Discussion'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setError(null) }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Start a Discussion
          </Button>
        )}
      </div>

      {/* Threads */}
      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No discussions yet"
          description="Be the first to start a conversation about this course."
        />
      ) : (
        <div className="space-y-3">
          {threads.map((thread, i) => {
            const threadReplies = replies[thread.id] || []
            const isOpen = expanded[thread.id]
            const canDelete = isModerator || thread.author_id === userId
            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Thread header */}
                <div className="p-5">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800">{thread.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mt-1 whitespace-pre-wrap">{thread.body}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                        <User className="w-3 h-3" />
                        <span>{thread.profiles?.full_name || 'Student'}</span>
                        <span>·</span>
                        <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(thread.id, true)}
                        className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                        aria-label="Delete discussion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Reply toggle */}
                  <button
                    onClick={() => toggle(thread.id)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {threadReplies.length > 0
                      ? `${threadReplies.length} ${threadReplies.length === 1 ? 'reply' : 'replies'}`
                      : 'Reply'}
                  </button>
                </div>

                {/* Replies */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-gray-50 border-t border-gray-100"
                    >
                      <div className="p-4 space-y-3">
                        {threadReplies.map((reply) => {
                          const canDeleteReply = isModerator || reply.author_id === userId
                          return (
                            <div key={reply.id} className="flex items-start gap-2">
                              <CornerDownRight className="w-3.5 h-3.5 text-gray-300 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0 bg-white rounded-lg border border-gray-100 px-3 py-2">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.body}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
                                  <span>{reply.profiles?.full_name || 'Student'}</span>
                                  <span>·</span>
                                  <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              {canDeleteReply && (
                                <button
                                  onClick={() => handleDelete(reply.id, false)}
                                  className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                                  aria-label="Delete reply"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )
                        })}

                        <ReplyComposer
                          threadId={thread.id}
                          courseId={courseId}
                          userId={userId}
                          onPosted={load}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Inline composer for posting a reply to a thread. */
function ReplyComposer({ threadId, courseId, userId, onPosted }) {
  const [value, setValue] = useState('')
  const [posting, setPosting] = useState(false)

  const submit = async () => {
    if (!value.trim()) return
    setPosting(true)
    try {
      const { error } = await supabase.from('course_discussions').insert({
        course_id: courseId,
        parent_id: threadId,
        author_id: userId,
        body: value.trim(),
      })
      if (!error) {
        setValue('')
        await onPosted()
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="flex items-start gap-2 pt-1">
      <CornerDownRight className="w-3.5 h-3.5 text-gray-300 mt-2.5 flex-shrink-0" />
      <div className="flex-1">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write a reply…"
          rows={2}
          className="text-sm"
        />
        <div className="mt-2">
          <Button size="sm" variant="primary" onClick={submit} disabled={posting || !value.trim()}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {posting ? 'Posting…' : 'Reply'}
          </Button>
        </div>
      </div>
    </div>
  )
}
