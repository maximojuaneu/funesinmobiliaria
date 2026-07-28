import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code         = req.nextUrl.searchParams.get('code')
  const returnedState = req.nextUrl.searchParams.get('state')
  const codeVerifier = req.cookies.get('canva_cv')?.value
  const savedState   = req.cookies.get('canva_state')?.value

  if (!code)         return NextResponse.json({ error: 'No code recibido' }, { status: 400 })
  if (!codeVerifier) return NextResponse.json({ error: 'code_verifier perdido (cookie expirada)' }, { status: 400 })
  if (returnedState !== savedState) return NextResponse.json({ error: 'State mismatch' }, { status: 400 })

  const res = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      client_id:     process.env.CANVA_CLIENT_ID!,
      client_secret: process.env.CANVA_CLIENT_SECRET!,
      redirect_uri:  process.env.CANVA_REDIRECT_URI!,
      code_verifier: codeVerifier,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Token exchange failed: ${err}` }, { status: 500 })
  }

  const { refresh_token } = await res.json()

  const html = `<!doctype html><html><body style="font-family:monospace;padding:2rem;max-width:700px;background:#f9f9f9">
  <h2 style="color:#016333">✅ Canva conectado exitosamente</h2>
  <p>Agregá esta línea al <strong>.env.local</strong>:</p>
  <pre style="background:#fff;border:1px solid #ccc;padding:1rem;border-radius:8px;word-break:break-all;user-select:all">CANVA_REFRESH_TOKEN=${refresh_token}</pre>
  <p style="color:#666;font-size:0.9rem">Después reiniciá el servidor (Ctrl+C y volvé a correrlo) y ya podés generar flyers.</p>
  </body></html>`

  const response = new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  response.cookies.delete('canva_cv')
  response.cookies.delete('canva_state')
  return response
}
