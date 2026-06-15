import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url requerida' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 })

    const html = await res.text()
    const images: string[] = []

    // ── 1. ZonaProp / Argenprop: buscar en __NEXT_DATA__ ─────────────────
    const nextDataMatch = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1])
        // Extraer todas las URLs de imagen del JSON completo
        const jsonStr = JSON.stringify(data)
        const urlRe = /"(https:\/\/[^"]+\.(?:jpg|jpeg|webp|png))(?:\?[^"]*)?"/gi
        let m
        const seen = new Set<string>()
        while ((m = urlRe.exec(jsonStr)) !== null && images.length < 3) {
          const imgUrl = m[1]
          // Filtrar thumbnails y logos: preferir imágenes de propiedad grandes
          if (
            !seen.has(imgUrl) &&
            !imgUrl.includes('logo') &&
            !imgUrl.includes('avatar') &&
            !imgUrl.includes('favicon') &&
            !imgUrl.includes('icon') &&
            !imgUrl.includes('map') &&
            !imgUrl.includes('static/img/user')
          ) {
            seen.add(imgUrl)
            images.push(imgUrl)
          }
        }
      } catch { /* ignorar errores de parse */ }
    }

    // ── 2. Fallback: og:image multiple ────────────────────────────────────
    if (images.length < 3) {
      const ogRe = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi
      let m
      while ((m = ogRe.exec(html)) !== null && images.length < 3) {
        if (!images.includes(m[1])) images.push(m[1])
      }
    }

    // ── 3. Fallback: og:image en orden inverso de atributos ───────────────
    if (images.length < 3) {
      const ogRe2 = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi
      let m
      while ((m = ogRe2.exec(html)) !== null && images.length < 3) {
        if (!images.includes(m[1])) images.push(m[1])
      }
    }

    // ── Título ────────────────────────────────────────────────────────────
    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/)
    const title = titleMatch?.[1]?.trim().replace(/\s*\|.*$/, '').replace(/\s*-[^-]*$/, '').trim() ?? ''

    return NextResponse.json({ title, images: images.slice(0, 3) })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Proxy para imágenes (evita CORS al convertir a base64 en el cliente)
export async function POST(req: NextRequest) {
  const { imageUrl } = await req.json() as { imageUrl: string }
  if (!imageUrl) return NextResponse.json({ error: 'imageUrl requerida' }, { status: 400 })
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 })
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const ct = res.headers.get('content-type') ?? 'image/jpeg'
    return NextResponse.json({ dataUrl: `data:${ct};base64,${base64}` })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
