// Shared Edge Function security middleware
// Validates JWT, checks role, logs invocation (Req 14.2, 14.4, 14.5, 14.6)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type AllowedRole = 'admin' | 'scholar' | 'mufti' | 'student'

export interface MiddlewareContext {
  userId: string
  role: AllowedRole
  supabase: ReturnType<typeof createClient>
}

export async function withAuth(
  req: Request,
  allowedRoles: AllowedRole[],
  functionName: string,
  handler: (ctx: MiddlewareContext) => Promise<Response>,
): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const jwt = authHeader.replace('Bearer ', '')

  // Create a client with the user's JWT to validate it via RLS
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Validate JWT by fetching the user
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: { user }, error: authError } = await userClient.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired JWT' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch role from profiles using service role client
  const serviceClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as AllowedRole | undefined

  if (!role || !allowedRoles.includes(role)) {
    await logInvocation(serviceClient, functionName, user.id, null, false)
    return new Response(JSON.stringify({ error: 'Insufficient role' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let success = false
  try {
    const response = await handler({ userId: user.id, role, supabase: serviceClient })
    success = response.ok
    await logInvocation(serviceClient, functionName, user.id, null, success)
    return response
  } catch (err) {
    await logInvocation(serviceClient, functionName, user.id, null, false)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function logInvocation(
  client: ReturnType<typeof createClient>,
  functionName: string,
  callerId: string,
  operation: string | null,
  success: boolean,
) {
  await client.from('edge_function_log').insert({
    function_name: functionName,
    caller_id: callerId,
    operation,
    success,
  })
}
