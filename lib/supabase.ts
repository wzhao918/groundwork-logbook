import { createClient, SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null
let serverClient: SupabaseClient | null = null

// Browser/anon client — read-only via RLS. Use this for /dashboard, /locations.
export function supabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase public env vars missing.')
  browserClient = createClient(url, key, { auth: { persistSession: false } })
  return browserClient
}

// Server/service-role client — bypasses RLS. Only call inside server actions or
// route handlers that have already verified the passcode session cookie.
export function supabaseServer(): SupabaseClient {
  if (serverClient) return serverClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server env vars missing.')
  serverClient = createClient(url, key, { auth: { persistSession: false } })
  return serverClient
}
