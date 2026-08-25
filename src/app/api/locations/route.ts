import { NextResponse } from 'next/server'
import { getLocations } from '@/lib/tokko'

export const dynamic = 'force-dynamic'

export async function GET() {
  const locations = await getLocations()
  return NextResponse.json(locations, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  })
}
