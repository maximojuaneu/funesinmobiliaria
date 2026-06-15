import { NextRequest, NextResponse } from 'next/server'
import { appendPropertyContactToSheet } from '@/lib/sheets'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    await appendPropertyContactToSheet(data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Property contact error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
