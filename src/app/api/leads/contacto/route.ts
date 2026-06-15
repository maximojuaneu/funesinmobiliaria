import { NextRequest, NextResponse } from 'next/server'
import { appendContactToSheet } from '@/lib/sheets'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    await appendContactToSheet(data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
