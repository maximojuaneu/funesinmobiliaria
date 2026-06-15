import { NextRequest, NextResponse } from 'next/server'
import { signToken, COOKIE } from '@/lib/auth'
import { resolveLogin } from '@/lib/agents'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const user = await resolveLogin(username, password)

  if (!user) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const token = await signToken({
    username: user.username,
    name:     user.name,
    role:     user.role,
    tokkoId:  user.tokkoId,
    picture:  user.picture,
  })
  const res = NextResponse.json({ ok: true })

  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 8,
    path:     '/',
  })

  return res
}
