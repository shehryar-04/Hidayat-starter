// Edge Function: generate-certificate
// Authorized roles: admin (Req 7.3)
import { withAuth } from '../_shared/middleware.ts'

Deno.serve((req) =>
  withAuth(req, ['admin'], 'generate-certificate', async ({ supabase }) => {
    const body = await req.json()
    // Implementation in Task 13
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  })
)
