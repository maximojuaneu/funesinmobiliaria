import { NextRequest, NextResponse } from 'next/server'
import { generateFlyer, FlyerData } from '@/lib/canva'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data: FlyerData = {
      tipo:       String(body.tipo       ?? ''),
      superficie: String(body.superficie ?? ''),
      ubicacion:  String(body.ubicacion  ?? ''),
      caract1:    String(body.caract1    ?? ''),
      caract2:    String(body.caract2    ?? ''),
      caract3:    String(body.caract3    ?? ''),
      fotoUrls:   Array.isArray(body.fotoUrls) ? body.fotoUrls.slice(0, 3) : [],
    }

    if (!data.tipo || !data.fotoUrls.length) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const url = await generateFlyer(data)
    return NextResponse.json({ ok: true, url })
  } catch (err: any) {
    console.error('Canva generate error:', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
