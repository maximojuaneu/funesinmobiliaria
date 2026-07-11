import { NextRequest, NextResponse } from 'next/server'

interface Window { count: number; resetAt: number }

const store = new Map<string, Window>()

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Returns a 429 response if the IP has exceeded the limit, otherwise null.
 * @param limit   max requests allowed in the window
 * @param windowMs  window duration in milliseconds
 */
export function rateLimit(
  req: NextRequest,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const ip  = getIp(req)
  const key = `${req.nextUrl.pathname}:${ip}`
  const now = Date.now()

  const win = store.get(key)

  if (!win || now > win.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  win.count++
  if (win.count > limit) {
    const retryAfter = Math.ceil((win.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intentá de nuevo en unos minutos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      },
    )
  }

  return null
}
