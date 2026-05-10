import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

// Admin (service-role) client — bypasses RLS. Only call inside server actions
// or route handlers that have already verified the user's session. Used for
// all writes (visits, locations, edit_events).
export function supabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin env vars missing.')
  adminClient = createClient(url, key, { auth: { persistSession: false } })
  return adminClient
}
