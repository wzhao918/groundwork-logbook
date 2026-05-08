import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const authed = await verifyToken(token)
  if (!authed) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

// Run on every route except /login, Next internals, and the favicon.
export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
}
