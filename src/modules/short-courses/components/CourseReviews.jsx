import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Send } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Button, Textarea, Spinner } from '../../../shared/ui'

/**
 * CourseReviews — Students rate and review courses.
 * Only enrolled students can submit. Shows average + all reviews.
 */
export function CourseReviews({ courseId, studentId, isEnrolled }) {
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [myReview, setMyReview] = useState(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { loadReviews() }, [courseId])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('course_reviews')
        .select(`
          id, rating, review_text, created_at, is_published,
          students:student_id (profiles:profile_id (full_name))
        `)
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      setReviews(data || [])
      setTotalReviews((data || []).length)

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length
        setAvgRating(Math.round(avg * 10) / 10)
      }

      // Check if current student already reviewed
      if (studentId) {
        const { data: mine } = await supabase
          .from('course_reviews')
          .select('id, rating, review_text')
          .eq('course_id', courseId)
          .eq('student_id', studentId)
          .maybeSingle()

        if (mine) {
          setMyReview(mine)
          setRating(mine.rating)
          setReviewText(mine.review_text || '')
        }
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a rating'); return }
    setSubmitting(true); setError(null)

    try {
      if (myReview) {
        // Update existing
        await supabase
          .from('course_reviews')
          .update({ rating, review_text: reviewText.trim() || null, updated_at: new Date().toISOString() })
          .eq('id', myReview.id)
      } else {
        // Create new
        await supabase.from('course_reviews').insert({
          course_id: courseId,
          student_id: studentId,
          rating,
          review_text: reviewText.trim() || null,
        })
      }

      await loadReviews()
    } catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="py-8 flex justify-center"><Spinner /></div>

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-800">{avgRating || '—'}</p>
          <StarRating value={avgRating} size="sm" />
          <p className="text-xs text-gray-400 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Write Review (only for enrolled students) */}
      {isEnrolled && studentId && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {myReview ? 'Update Your Review' : 'Write a Review'}
          </h3>

          <div className="mb-3">
            <StarRating
              value={hoverRating || rating}
              interactive
              onHover={setHoverRating}
              onClick={setRating}
            />
          </div>

          <Textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Share your experience with this course... (optional)"
            rows={3}
            className="mb-3"
          />

          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={submitting || rating === 0}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {submitting ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
          </Button>
        </div>
      )}

      {/* Review List */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-lg border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {review.students?.profiles?.full_name || 'Student'}
                  </span>
                  <StarRating value={review.rating} size="xs" />
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.review_text && (
                <p className="text-sm text-gray-600 leading-relaxed">{review.review_text}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Star Rating Component ───────────────────────────────────
function StarRating({ value, size = 'md', interactive = false, onHover, onClick }) {
  const sizes = { xs: 'w-3.5 h-3.5', sm: 'w-4 h-4', md: 'w-5 h-5' }
  const starSize = sizes[size] || sizes.md

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && onHover?.(star)}
          onMouseLeave={() => interactive && onHover?.(0)}
          onClick={() => interactive && onClick?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${starSize} ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} transition-colors`}
          />
        </button>
      ))}
    </div>
  )
}
