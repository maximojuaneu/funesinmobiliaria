import { NextRequest, NextResponse } from 'next/server'
import { appendContactToSheet } from '@/lib/sheets'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 5, 60_000)
  if (limited) return limited

  try {
    const data = await req.json()
    await appendContactToSheet(data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
