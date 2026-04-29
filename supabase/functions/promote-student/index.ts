// Edge Function: promote-student
// Authorized roles: admin, scholar (Req 4.5)
import { withAuth } from '../_shared/middleware.ts'

Deno.serve((req) =>
  withAuth(req, ['admin', 'scholar'], 'promote-student', async ({ supabase }) => {
    const body = await req.json()
    // Implementation in Task 10
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  })
)
