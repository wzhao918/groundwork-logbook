import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// Magic-link / invite landing point. Supabase redirects here with a `code`
// query param; we exchange it for a session cookie and forward the user on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/log'

  if (code) {
    const supabase = await supabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`)
}
