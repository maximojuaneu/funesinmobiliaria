import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE } from '@/lib/auth'

const PROTECTED = ['/dashboard']
const DESIGNER_ALLOWED = ['/dashboard/flyers', '/dashboard/metricas']

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

    if (session.role === 'designer') {
      const allowed = DESIGNER_ALLOWED.some(p => pathname.startsWith(p))
      if (!allowed) {
        const url = req.nextUrl.clone()
        url.pathname = '/dashboard/flyers'
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }
