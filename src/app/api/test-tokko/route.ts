import { NextResponse } from 'next/server'
import { getProperties } from '@/lib/tokko'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sale = await getProperties({ operation: 'Sale' })
    const rent = await getProperties({ operation: 'Rent' })
    return NextResponse.json({
      saleCount: sale.count,
      rentCount: rent.count,
      firstSale: sale.objects[0]?.address ?? null,
      firstRent: rent.objects[0]?.address ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 500) })
  }
}
