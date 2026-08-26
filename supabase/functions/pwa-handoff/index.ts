import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@^2'

const allowedOrigins = new Set([
  'https://falatua.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
])
const codeHashPattern = /^[0-9a-f]{64}$/
const handoffLifetimeMilliseconds = 5 * 60 * 1000
const recentSignInSeconds = 10 * 60

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

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) throw new Error('Missing server configuration.')
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1] ?? null
}

function issuedAt(token: string) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))) as { iat?: unknown }
    const value = Number(decoded.iat)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

export default {
  fetch: async (request: Request) => {
    const origin = request.headers.get('origin') ?? ''
    if (request.method === 'OPTIONS') return response(origin, 204, {})
    if (request.method !== 'POST' || !allowedOrigins.has(origin)) return response(origin, 403, { error: 'Request not allowed.', errorCode: 'ORIGIN_DENIED' })

    let body: { action?: string; codeHash?: string }
    try { body = await request.json() } catch { return response(origin, 400, { error: 'Invalid request.', errorCode: 'REQUEST_INVALID' }) }
    if (!codeHashPattern.test(body.codeHash ?? '')) return response(origin, 400, { error: 'Invalid request.', errorCode: 'REQUEST_INVALID' })

    const admin = adminClient()
    const now = new Date()
    await admin.from('forgepath_auth_handoffs').delete().lt('expires_at', now.toISOString())

    if (body.action === 'create') {
      const token = bearerToken(request)
      if (!token) return response(origin, 401, { error: 'Authentication required.', errorCode: 'AUTH_REQUIRED' })
      const { data: userData, error: userError } = await admin.auth.getUser(token)
      if (userError || !userData.user) return response(origin, 401, { error: 'Authentication required.', errorCode: 'AUTH_REQUIRED' })
      const tokenIssuedAt = issuedAt(token)
      if (!tokenIssuedAt || Math.floor(Date.now() / 1000) - tokenIssuedAt > recentSignInSeconds) {
        return response(origin, 401, { error: 'Open a new ForgePath sign-in link before creating a Home Screen code.', errorCode: 'AUTH_STALE' })
      }
      const { error } = await admin.from('forgepath_auth_handoffs').upsert({
        user_id: userData.user.id,
        code_hash: body.codeHash,
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + handoffLifetimeMilliseconds).toISOString(),
        redeemed_at: null
      }, { onConflict: 'user_id' })
      if (error) return response(origin, 500, { error: 'The Home Screen code could not be created.', errorCode: 'CODE_CREATE_FAILED' })
      return response(origin, 200, { expiresInSeconds: handoffLifetimeMilliseconds / 1000 })
    }

    if (body.action === 'redeem') {
      const redeemedAt = now.toISOString()
      const { data: handoff, error: redeemError } = await admin
        .from('forgepath_auth_handoffs')
        .update({ redeemed_at: redeemedAt })
        .eq('code_hash', body.codeHash)
        .is('redeemed_at', null)
        .gt('expires_at', redeemedAt)
        .select('user_id')
        .maybeSingle()
      if (redeemError || !handoff) return response(origin, 400, { error: 'That Home Screen code is invalid or expired.', errorCode: 'CODE_INVALID' })

      const { data: userData, error: userError } = await admin.auth.admin.getUserById(handoff.user_id)
      const email = userData.user?.email
      if (userError || !email) return response(origin, 400, { error: 'That Home Screen code is invalid or expired.', errorCode: 'CODE_INVALID' })
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
      const tokenHash = linkData.properties?.hashed_token
      if (linkError || !tokenHash) {
        await admin
          .from('forgepath_auth_handoffs')
          .update({ redeemed_at: null })
          .eq('user_id', handoff.user_id)
          .eq('redeemed_at', redeemedAt)
          .gt('expires_at', redeemedAt)
        return response(origin, 500, { error: 'The Home Screen sign-in could not be completed.', errorCode: 'TOKEN_CREATE_FAILED' })
      }
      return response(origin, 200, { tokenHash })
    }

    return response(origin, 400, { error: 'Invalid request.', errorCode: 'REQUEST_INVALID' })
  }
}
