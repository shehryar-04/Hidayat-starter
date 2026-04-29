import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const INITIAL = {
  // Meta
  step: 1,
  draftId: null,          // short_courses.id once saved to DB
  lastSaved: null,        // ISO timestamp of last DB save

  // Step 1 — Basic info
  title: '',
  subtitle: '',
  description: '',
  category: '',
  subcategory: '',
  tags: [],
  language: 'English',
  level: 'All levels',

  // Step 2 — Learning
  objectives: [],
  requirements: [],

  // Step 3 — Curriculum
  sections: [],

  // Step 4 — Media
  thumbnailPreview: null,  // object URL (not persisted across sessions)
  promoVideoUrl: '',

  // Step 5 — Pricing & settings
  isFree: false,
  fee: '',
  qaEnabled: true,
  announcementsEnabled: true,
  commentsEnabled: true,
}

export const useCourseFormStore = create(
  persist(
    (set) => ({
      ...INITIAL,

      // Generic field setter
      setField: (field, value) => set({ [field]: value }),

      // Step navigation
      setStep: (step) => set({ step }),

      // Mark as saved to DB
      markSaved: (draftId) => set({ draftId, lastSaved: new Date().toISOString() }),

      // Reset the entire form (after publish or explicit clear)
      reset: () => set({ ...INITIAL }),

      // Load existing course data for editing
      loadCourse: (course, sections = []) => set({
        step: 1,
        draftId: course.id,
        lastSaved: null,
        title: course.title || '',
        subtitle: course.subtitle || '',
        description: course.description || '',
        category: course.category || '',
        subcategory: course.subcategory || '',
        tags: course.tags || [],
        language: course.language || 'English',
        level: course.level || 'All levels',
        objectives: course.learning_objectives || [],
        requirements: course.requirements || [],
        sections,
        thumbnailPreview: course.thumbnail_url || null,
        promoVideoUrl: course.promo_video_url || '',
        isFree: course.is_free || false,
        fee: course.fee ? String(course.fee) : '',
        qaEnabled: course.qa_enabled ?? true,
        announcementsEnabled: course.announcements_enabled ?? true,
        commentsEnabled: course.comments_enabled ?? true,
      }),
    }),
    {
      name: 'course-form-draft',   // localStorage key
      // Don't persist the object URL — it's only valid for the current session
      partialize: (state) => {
        const { thumbnailPreview, ...rest } = state
        return rest
      },
    }
  )
)
