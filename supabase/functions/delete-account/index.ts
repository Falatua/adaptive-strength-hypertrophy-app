import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createSupabaseContext } from 'jsr:@supabase/server@^1'

const allowedOrigins = new Set([
  'https://falatua.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
])

function response(origin: string, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'access-control-allow-origin': allowedOrigins.has(origin) ? origin : 'https://falatua.github.io',
      'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
      'access-control-allow-methods': 'POST, OPTIONS',
      'vary': 'origin'
    }
  })
}

export default {
  fetch: async (request: Request) => {
    const origin = request.headers.get('origin') ?? ''
    if (request.method === 'OPTIONS') return response(origin, 204, {})
    if (request.method !== 'POST' || !allowedOrigins.has(origin)) return response(origin, 403, { error: 'Request not allowed.' })

    const { data: context, error: contextError } = await createSupabaseContext(request, { auth: 'user' })
    if (contextError || !context?.userClaims?.sub) return response(origin, 401, { error: 'Authentication required.' })

    const issuedAt = Number(context.jwtClaims?.iat)
    if (!Number.isFinite(issuedAt) || Math.floor(Date.now() / 1000) - issuedAt > 300) {
      return response(origin, 401, { error: 'Recent sign-in required.' })
    }

    let body: { confirmation?: string }
    try { body = await request.json() } catch { return response(origin, 400, { error: 'Invalid request.' }) }
    if (body.confirmation !== 'DELETE') return response(origin, 400, { error: 'Delete confirmation required.' })

    const { error: deleteError } = await context.supabaseAdmin.auth.admin.deleteUser(context.userClaims.sub)
    if (deleteError) return response(origin, 500, { error: 'The account could not be deleted.' })

    return response(origin, 200, { status: 'deleted' })
  }
}
