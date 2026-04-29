// Edge Function: bulk-student-update
// Authorized roles: admin (Req 10.5)
import { withAuth } from '../_shared/middleware.ts'

Deno.serve((req) =>
  withAuth(req, ['admin'], 'bulk-student-update', async ({ supabase, userId }) => {
    const body = await req.json()
    const { student_ids, operation, new_status, new_program, new_level } = body

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid student_ids' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!operation || !['status', 'program'].includes(operation)) {
      return new Response(JSON.stringify({ error: 'Invalid operation' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      if (operation === 'status') {
        if (!new_status || !['active', 'suspended', 'graduated', 'withdrawn'].includes(new_status)) {
          return new Response(JSON.stringify({ error: 'Invalid new_status' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Fetch current statuses for history records
        const { data: currentStudents } = await supabase
          .from('students')
          .select('id, status')
          .in('id', student_ids)

        // Update all students to new status
        const { error: updateError } = await supabase
          .from('students')
          .update({ status: new_status })
          .in('id', student_ids)

        if (updateError) throw updateError

        // Record status changes in history
        const historyRecords = currentStudents?.map(s => ({
          student_id: s.id,
          old_status: s.status,
          new_status,
          changed_by: userId,
        })) || []

        if (historyRecords.length > 0) {
          const { error: historyError } = await supabase
            .from('student_status_history')
            .insert(historyRecords)

          if (historyError) throw historyError
        }
      } else if (operation === 'program') {
        if (!new_program || !new_level) {
          return new Response(JSON.stringify({ error: 'Invalid new_program or new_level' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Check if level exists
        const { data: levelExists } = await supabase
          .from('dars_e_nizami_levels')
          .select('id')
          .eq('id', new_level)
          .single()

        if (!levelExists) {
          return new Response(JSON.stringify({ error: 'Invalid level' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Create or update enrollments for all students
        const enrollmentRecords = student_ids.map(student_id => ({
          student_id,
          program: new_program,
          level_id: new_level,
          enrolled_at: new Date().toISOString().split('T')[0],
          status: 'active',
        }))

        // Delete existing enrollments for these students in this program
        const { error: deleteError } = await supabase
          .from('student_enrollments')
          .delete()
          .in('student_id', student_ids)
          .eq('program', new_program)

        if (deleteError) throw deleteError

        // Insert new enrollments
        const { error: insertError } = await supabase
          .from('student_enrollments')
          .insert(enrollmentRecords)

        if (insertError) throw insertError
      }

      return new Response(JSON.stringify({
        ok: true,
        message: `Successfully updated ${student_ids.length} students`,
        count: student_ids.length,
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      console.error('Bulk update error:', err)
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  })
)
