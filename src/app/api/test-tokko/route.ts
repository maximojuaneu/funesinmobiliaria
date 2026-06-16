import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.TOKKO_API_KEY ?? ''
  const base = process.env.TOKKO_BASE_URL ?? 'https://www.tokkobroker.com/api/v1'

  if (!key) return NextResponse.json({ error: 'TOKKO_API_KEY no configurada' })

  try {
    const url = `${base}/property/?key=${key}&format=json&limit=200`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    const props = data.objects ?? []
    const withSale = props.filter((p: any) => p.operations?.some((op: any) => op.operation_id === 1))
    const withRent = props.filter((p: any) => p.operations?.some((op: any) => op.operation_id === 2))
    const firstOps = props[0]?.operations ?? []
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      totalCount: data.meta?.total_count ?? null,
      fetchedCount: props.length,
      withSaleOpId1: withSale.length,
      withRentOpId2: withRent.length,
      firstPropertyAddress: props[0]?.address ?? null,
      firstPropertyOperations: firstOps,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
