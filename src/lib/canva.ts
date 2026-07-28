const BASE   = 'https://api.canva.com/rest/v1'
const TEMPLATE_DESIGN_ID = process.env.CANVA_TEMPLATE_DESIGN_ID ?? 'DAHQri09LiU'

// Element IDs in the template design (page 14 copy)
const ELEMENTS = {
  tipo:       'PBQH90hHyvmHbf78-LB8F8w0BtBCgfYdp',
  superficie: 'PBQH90hHyvmHbf78-LBDbSygSfKzDRQSc',
  ubicacion:  'PBQH90hHyvmHbf78-LBKsvsldWj3P0xJY',
  caract1:    'PBQH90hHyvmHbf78-LBVRGH5SPwfn7X46',
  caract2:    'PBQH90hHyvmHbf78-LBPtGhqJTnh0xYyF',
  caract3:    'PBQH90hHyvmHbf78-LBnv2rRtXq4MzS2X',
  foto1:      'PBQH90hHyvmHbf78-LBVCpp6HphTKq3LS-a',
  foto2:      'PBQH90hHyvmHbf78-LBX9HjBss9cmV7fD-a',
  foto3:      'PBQH90hHyvmHbf78-LB1NV7zYb7XJQ7HC-a',
}

async function getToken(): Promise<string> {
  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: process.env.CANVA_REFRESH_TOKEN!,
      client_id:     process.env.CANVA_CLIENT_ID!,
      client_secret: process.env.CANVA_CLIENT_SECRET!,
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)
  return (await res.json()).access_token as string
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

/** Upload a public image URL to Canva assets, return asset_id */
async function uploadAsset(imageUrl: string, name: string, token: string): Promise<string> {
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Cannot fetch image: ${imageUrl}`)
  const buffer = await imgRes.arrayBuffer()

  const res = await fetch(`${BASE}/assets/upload`, {
    method: 'POST',
    headers: {
      Authorization:           `Bearer ${token}`,
      'Content-Type':          imgRes.headers.get('content-type') ?? 'image/jpeg',
      'Asset-Upload-Metadata': JSON.stringify({ name_base64: btoa(name) }),
    },
    body: buffer,
  })
  if (!res.ok) throw new Error(`Asset upload failed: ${await res.text()}`)
  const { job } = await res.json()

  for (let i = 0; i < 20; i++) {
    await delay(1500)
    const poll = await fetch(`${BASE}/assets/${job.id}`, { headers: { Authorization: `Bearer ${token}` } })
    const s = await poll.json()
    if (s.job?.status === 'success') return s.job.asset.id as string
    if (s.job?.status === 'failed') throw new Error('Asset upload failed')
  }
  throw new Error('Asset upload timeout')
}

export interface FlyerData {
  tipo:       string  // "DEPARTAMENTO EN VENTA"
  superficie: string  // "Superficie de 84 m²"
  ubicacion:  string  // "Rosario - Zona Centro - Piso 4 - A"
  caract1:    string  // "3 dormitorios"
  caract2:    string  // "2 baños"
  caract3:    string  // "living"
  fotoUrls:   string[] // up to 3 Tokko photo URLs
}

/** Generate a flyer JPG: copy template → edit texts+photos → export */
export async function generateFlyer(data: FlyerData): Promise<string> {
  const token = await getToken()

  // 1. Copy the template design
  const copyRes = await fetch(`${BASE}/designs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ design_type: { type: 'preset', name: 'MobileVideo' }, asset_id: undefined }),
  })

  // Use the copy endpoint instead
  const copyRes2 = await fetch(`${BASE}/designs/${TEMPLATE_DESIGN_ID}/copies`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!copyRes2.ok) throw new Error(`Copy failed: ${await copyRes2.text()}`)
  const { design } = await copyRes2.json()
  const designId = design.id as string

  // 2. Upload photos in parallel
  const fotos = data.fotoUrls.slice(0, 3)
  const assetIds = await Promise.all(fotos.map((url, i) => uploadAsset(url, `foto${i + 1}`, token)))

  // 3. Open editing transaction
  const txRes = await fetch(`${BASE}/designs/${designId}/editing_sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!txRes.ok) throw new Error(`Editing session failed: ${await txRes.text()}`)
  const { editing_session } = await txRes.json()
  const sessionId = editing_session.id as string

  // 4. Build operations: replace texts
  const ops: any[] = [
    { type: 'replace_text', element_id: ELEMENTS.tipo,       text: data.tipo       },
    { type: 'replace_text', element_id: ELEMENTS.superficie, text: data.superficie },
    { type: 'replace_text', element_id: ELEMENTS.ubicacion,  text: data.ubicacion  },
    { type: 'replace_text', element_id: ELEMENTS.caract1,    text: data.caract1    },
    { type: 'replace_text', element_id: ELEMENTS.caract2,    text: data.caract2    },
    { type: 'replace_text', element_id: ELEMENTS.caract3,    text: data.caract3    },
  ]

  // Replace images
  const photoFields = [ELEMENTS.foto1, ELEMENTS.foto2, ELEMENTS.foto3]
  for (let i = 0; i < assetIds.length; i++) {
    ops.push({ type: 'update_fill', element_id: photoFields[i], asset_type: 'image', asset_id: assetIds[i], alt_text: `Foto ${i + 1}` })
  }

  // 5. Apply operations
  const editRes = await fetch(`${BASE}/designs/${designId}/editing_sessions/${sessionId}/commands`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands: [{ type: 'edit_page', page_index: 1, operations: ops }] }),
  })
  if (!editRes.ok) throw new Error(`Edit failed: ${await editRes.text()}`)

  // 6. Commit
  await fetch(`${BASE}/designs/${designId}/editing_sessions/${sessionId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  // 7. Export as JPG
  const expRes = await fetch(`${BASE}/exports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ design_id: designId, format: { type: 'jpg', quality: 95 } }),
  })
  if (!expRes.ok) throw new Error(`Export failed: ${await expRes.text()}`)
  const { job } = await expRes.json()

  for (let i = 0; i < 30; i++) {
    await delay(2000)
    const poll = await fetch(`${BASE}/exports/${job.id}`, { headers: { Authorization: `Bearer ${token}` } })
    const s = await poll.json()
    if (s.job?.status === 'success') return s.job.urls[0] as string
    if (s.job?.status === 'failed') throw new Error('Export failed')
  }
  throw new Error('Export timeout')
}
