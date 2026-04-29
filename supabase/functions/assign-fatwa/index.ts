// Edge Function: assign-fatwa
// Authorized roles: admin, mufti (Req 8.3)
import { withAuth } from '../_shared/middleware.ts'

Deno.serve((req) =>
  withAuth(req, ['admin', 'mufti'], 'assign-fatwa', async ({ supabase }) => {
    const body = await req.json()
    // Implementation in Task 15
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  })
)
