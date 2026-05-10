import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// Email template landing point for invites, magic links, recovery, and
// email-change confirmations. The email's link includes a token_hash + type;
// we verify it server-side, which sets the session cookie, then redirect.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/log'

  if (token_hash && type) {
    const supabase = await supabaseServer()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=invalid_link', request.url),
  )
}
