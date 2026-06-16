import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.TOKKO_API_KEY ?? ''
  const base = process.env.TOKKO_BASE_URL ?? 'https://www.tokkobroker.com/api/v1'

  if (!key) return NextResponse.json({ error: 'TOKKO_API_KEY no configurada' })

  try {
    const url = `${base}/property/?key=${key}&format=json&limit=1`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      totalCount: data.meta?.total_count ?? null,
      firstProperty: data.objects?.[0]?.address ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
