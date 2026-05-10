import { createBrowserClient } from '@supabase/ssr'

// Session-aware browser client. Use this in client components for reads
// (e.g., the location typeahead) and for sign-in / sign-out calls.
export function supabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
