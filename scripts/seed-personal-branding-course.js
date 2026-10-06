/**
 * Seed Personal Branding Masterclass directly into Supabase via JavaScript API.
 * 
 * Usage:
 *   node scripts/seed-personal-branding-course.js
 * 
 * Required Environment Variables (in .env, .env.local, or process.env):
 *   VITE_SUPABASE_URL or SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { personalBrandingCourse } from '../src/modules/short-courses/data/personalBrandingCourse.js'

dotenv.config()
dotenv.config({ path: '.env.local' })

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim()

function makeUuid(prefix, num) {
  const hexNum = String(num).padStart(12, '0')
  return `${prefix}1000000-0000-0000-0000-${hexNum}`
}

async function seed() {
  console.log('========================================================')
  console.log('Hidayat LMS — Seeding Personal Branding Masterclass')
  console.log('========================================================')

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase URL or Key not detected in environment variables.')
    console.log('👉 To seed via SQL directly:')
    console.log('   Open Supabase Studio > SQL Editor')
    console.log('   Copy & Run: supabase_personal_branding_course.sql')
    console.log('--------------------------------------------------------')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('1. Checking connection to Supabase...')
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  const adminId = adminUser?.id || null
  console.log(`   Admin profile ID: ${adminId || 'None found (will use NULL)'}`)

  console.log('2. Upserting Short Course...')
  const coursePayload = {
    id: personalBrandingCourse.id,
    title: personalBrandingCourse.title,
    subtitle: personalBrandingCourse.subtitle,
    description: personalBrandingCourse.description,
    category: personalBrandingCourse.category,
    subcategory: personalBrandingCourse.subcategory,
    tags: personalBrandingCourse.tags,
    language: personalBrandingCourse.language,
    level: personalBrandingCourse.level,
    learning_objectives: personalBrandingCourse.learning_objectives,
    requirements: personalBrandingCourse.requirements,
    thumbnail_url: personalBrandingCourse.thumbnail_url,
    promo_video_url: personalBrandingCourse.promo_video_url,
    is_free: personalBrandingCourse.is_free,
    fee: personalBrandingCourse.fee,
    duration_weeks: personalBrandingCourse.duration_weeks,
    completion_rule: personalBrandingCourse.completion_rule,
    min_completion_pct: personalBrandingCourse.min_completion_pct,
    qa_enabled: personalBrandingCourse.qa_enabled,
    announcements_enabled: personalBrandingCourse.announcements_enabled,
    comments_enabled: personalBrandingCourse.comments_enabled,
    status: personalBrandingCourse.status,
    created_by: adminId,
  }

  const { error: cErr } = await supabase
    .from('short_courses')
    .upsert(coursePayload, { onConflict: 'id' })

  if (cErr) {
    console.error('❌ Failed to upsert course:', cErr.message)
    return
  }
  console.log('   ✓ Course upserted successfully.')

  console.log('3. Upserting Sections and 30 Video Lectures...')
  let lectureCount = 0

  for (const section of personalBrandingCourse.sections) {
    const { error: sErr } = await supabase
      .from('course_sections')
      .upsert({
        id: section.id,
        course_id: personalBrandingCourse.id,
        title: section.title,
        position: section.position,
      }, { onConflict: 'id' })

    if (sErr) {
      console.error(`   ❌ Failed to upsert section "${section.title}":`, sErr.message)
      continue
    }

    const lectureRows = section.lectures.map((l) => ({
      id: l.id,
      section_id: section.id,
      course_id: personalBrandingCourse.id,
      title: l.title,
      position: l.position,
      content_text: l.content_text,
      video_url: l.video_url || null,
      duration_minutes: l.duration_minutes,
      is_free_preview: l.is_free_preview,
    }))

    const { error: lErr } = await supabase
      .from('course_lectures')
      .upsert(lectureRows, { onConflict: 'id' })

    if (lErr) {
      console.error(`   ❌ Failed to upsert lectures for section "${section.title}":`, lErr.message)
    } else {
      lectureCount += lectureRows.length
      console.log(`   ✓ Section "${section.title}" (${lectureRows.length} lectures) synced.`)
    }
  }

  console.log(`   ✓ Total lectures synced: ${lectureCount}/30`)

  // 4. Milestone Quizzes
  if (personalBrandingCourse.quizzes?.length) {
    console.log('4. Upserting Milestone Quizzes...')
    for (const q of personalBrandingCourse.quizzes) {
      const { error: qErr } = await supabase
        .from('quizzes')
        .upsert({
          id: q.id,
          course_id: personalBrandingCourse.id,
          section_id: q.section_id,
          title: q.title,
          description: q.description,
          passing_score: q.passing_score,
          time_limit_minutes: q.time_limit_minutes,
          attempts_allowed: q.attempts_allowed,
          required_for_certificate: q.required_for_certificate,
          is_published: true,
          created_by: adminId,
        }, { onConflict: 'id' })

      if (qErr) {
        console.error(`   ❌ Failed to upsert quiz "${q.title}":`, qErr.message)
        continue
      }

      let questionCounter = 1
      let optionCounter = 1

      for (let qi = 0; qi < q.questions.length; qi++) {
        const qq = q.questions[qi]
        const qid = makeUuid('e', questionCounter++)

        const { error: qqErr } = await supabase
          .from('quiz_questions')
          .upsert({
            id: qid,
            quiz_id: q.id,
            question_type: qq.question_type,
            question_text: qq.question_text,
            points: qq.points,
            position: qi,
            explanation: qq.explanation,
          }, { onConflict: 'id' })

        if (qqErr) continue

        const optRows = qq.options.map((opt, oi) => ({
          id: makeUuid('f', optionCounter++),
          question_id: qid,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          position: oi,
        }))

        await supabase.from('quiz_options').upsert(optRows, { onConflict: 'id' })
      }
      console.log(`   ✓ Quiz "${q.title}" synced.`)
    }
  }

  console.log('========================================================')
  console.log('🎉 Course successfully seeded into Supabase!')
  console.log('Course ID:', personalBrandingCourse.id)
  console.log('========================================================')
}

seed().catch((err) => {
  console.error('Fatal seeding error:', err)
  process.exit(1)
})
