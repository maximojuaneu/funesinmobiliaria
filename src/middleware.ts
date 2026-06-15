import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE } from '@/lib/auth'

const PROTECTED = ['/dashboard']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PROTECTED.some(p => pathname.startsWith(p))) {
    const token   = req.cookies.get(COOKIE)?.value
    const session = token ? await verifyToken(token) : null
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }
