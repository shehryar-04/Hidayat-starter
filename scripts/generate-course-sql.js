import fs from 'fs'
import { personalBrandingCourse as c } from '../src/modules/short-courses/data/personalBrandingCourse.js'

function makeUuid(prefix, num) {
  const hexNum = String(num).padStart(12, '0')
  return `${prefix}1000000-0000-0000-0000-${hexNum}`
}

let sql = `-- ============================================================
-- HIDAYAT LMS — PERSONAL BRANDING MASTERCLASS SEED MIGRATION
-- Run this in Supabase Studio SQL Editor
-- ============================================================

BEGIN;

-- 1. Upsert the Short Course
INSERT INTO public.short_courses (
  id, title, subtitle, description, category, subcategory, tags,
  language, level, learning_objectives, requirements, thumbnail_url,
  promo_video_url, is_free, fee, duration_weeks, completion_rule,
  min_completion_pct, qa_enabled, announcements_enabled, comments_enabled,
  status, created_by
) VALUES (
  '${c.id}',
  $txt$${c.title}$txt$,
  $txt$${c.subtitle}$txt$,
  $txt$${c.description}$txt$,
  $txt$${c.category}$txt$,
  $txt$${c.subcategory}$txt$,
  ARRAY[${c.tags.map(t => "$txt$" + t + "$txt$").join(', ')}],
  '${c.language}',
  '${c.level}',
  ARRAY[${c.learning_objectives.map(o => "$txt$" + o + "$txt$").join(', ')}],
  ARRAY[${c.requirements.map(r => "$txt$" + r + "$txt$").join(', ')}],
  $txt$${c.thumbnail_url}$txt$,
  $txt$${c.promo_video_url}$txt$,
  ${c.is_free},
  ${c.fee},
  ${c.duration_weeks},
  '${c.completion_rule}',
  ${c.min_completion_pct},
  ${c.qa_enabled},
  ${c.announcements_enabled},
  ${c.comments_enabled},
  '${c.status}',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  tags = EXCLUDED.tags,
  language = EXCLUDED.language,
  level = EXCLUDED.level,
  learning_objectives = EXCLUDED.learning_objectives,
  requirements = EXCLUDED.requirements,
  thumbnail_url = EXCLUDED.thumbnail_url,
  promo_video_url = EXCLUDED.promo_video_url,
  is_free = EXCLUDED.is_free,
  fee = EXCLUDED.fee,
  duration_weeks = EXCLUDED.duration_weeks,
  completion_rule = EXCLUDED.completion_rule,
  min_completion_pct = EXCLUDED.min_completion_pct,
  qa_enabled = EXCLUDED.qa_enabled,
  announcements_enabled = EXCLUDED.announcements_enabled,
  comments_enabled = EXCLUDED.comments_enabled,
  status = EXCLUDED.status;

-- 2. Upsert Course Sections & Lectures
`

for (const s of c.sections) {
  sql += `
-- Section: ${s.title}
INSERT INTO public.course_sections (id, course_id, title, position)
VALUES ('${s.id}', '${c.id}', $txt$${s.title}$txt$, ${s.position})
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  position = EXCLUDED.position;
`

  for (const l of s.lectures) {
    sql += `
-- Lecture ${l.position + 1}: ${l.title}
INSERT INTO public.course_lectures (
  id, section_id, course_id, title, position,
  content_text, video_url, duration_minutes, is_free_preview
) VALUES (
  '${l.id}',
  '${s.id}',
  '${c.id}',
  $txt$${l.title}$txt$,
  ${l.position},
  $txt$${l.content_text}$txt$,
  ${l.video_url ? "$txt$" + l.video_url + "$txt$" : 'NULL'},
  ${l.duration_minutes || 'NULL'},
  ${l.is_free_preview}
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  position = EXCLUDED.position,
  content_text = EXCLUDED.content_text,
  video_url = EXCLUDED.video_url,
  duration_minutes = EXCLUDED.duration_minutes,
  is_free_preview = EXCLUDED.is_free_preview;
`
  }
}

// 3. Quizzes
if (c.quizzes && c.quizzes.length > 0) {
  sql += `\n-- 3. Upsert Milestone Quizzes & Questions\n`
  let questionCounter = 1
  let optionCounter = 1

  for (const q of c.quizzes) {
    sql += `
INSERT INTO public.quizzes (
  id, course_id, section_id, title, description, passing_score,
  time_limit_minutes, attempts_allowed, required_for_certificate,
  is_published, created_by
) VALUES (
  '${q.id}',
  '${c.id}',
  '${q.section_id}',
  $txt$${q.title}$txt$,
  $txt$${q.description}$txt$,
  ${q.passing_score},
  ${q.time_limit_minutes},
  ${q.attempts_allowed},
  ${q.required_for_certificate},
  true,
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  passing_score = EXCLUDED.passing_score,
  time_limit_minutes = EXCLUDED.time_limit_minutes,
  attempts_allowed = EXCLUDED.attempts_allowed,
  required_for_certificate = EXCLUDED.required_for_certificate,
  is_published = true;
`
    for (let qi = 0; qi < q.questions.length; qi++) {
      const qq = q.questions[qi]
      const qid = makeUuid('e', questionCounter++)

      sql += `
INSERT INTO public.quiz_questions (
  id, quiz_id, question_type, question_text, points, position, explanation
) VALUES (
  '${qid}',
  '${q.id}',
  '${qq.question_type}',
  $txt$${qq.question_text}$txt$,
  ${qq.points},
  ${qi},
  $txt$${qq.explanation}$txt$
)
ON CONFLICT (id) DO UPDATE SET
  question_type = EXCLUDED.question_type,
  question_text = EXCLUDED.question_text,
  points = EXCLUDED.points,
  position = EXCLUDED.position,
  explanation = EXCLUDED.explanation;
`
      for (let oi = 0; oi < qq.options.length; oi++) {
        const opt = qq.options[oi]
        const optId = makeUuid('f', optionCounter++)

        sql += `
INSERT INTO public.quiz_options (
  id, question_id, option_text, is_correct, position
) VALUES (
  '${optId}',
  '${qid}',
  $txt$${opt.option_text}$txt$,
  ${opt.is_correct},
  ${oi}
)
ON CONFLICT (id) DO UPDATE SET
  option_text = EXCLUDED.option_text,
  is_correct = EXCLUDED.is_correct,
  position = EXCLUDED.position;
`
      }
    }
  }
}

sql += `
COMMIT;
`

fs.writeFileSync('supabase_personal_branding_course.sql', sql)
fs.writeFileSync('scripts/seed-personal-branding-course.sql', sql)
console.log('Successfully wrote supabase_personal_branding_course.sql (bytes: ' + sql.length + ')')
