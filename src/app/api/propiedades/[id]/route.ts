import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import path from 'path'
import fs from 'fs'

const DATA_FILE = path.join(process.cwd(), 'data', 'propiedades.json')
const AUTH_FILE = path.join(process.cwd(), 'data', 'autorizaciones.json')

function readPropiedades() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
}
function writePropiedades(d: unknown[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2))
}
function readAutorizaciones() {
  try { return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')) } catch { return [] }
}
function writeAutorizaciones(d: unknown[]) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(d, null, 2))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const all  = readPropiedades()
  const idx  = all.findIndex(
    (p: { id: string; agente: string }) =>
      p.id === params.id && p.agente.toLowerCase() === session.name.toLowerCase()
  )
  if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  all[idx] = { ...all[idx], ...body, id: params.id, agente: session.name }
  writePropiedades(all)
  return NextResponse.json(all[idx])
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const all = readPropiedades()
  const filtered = all.filter(
    (p: { id: string; agente: string }) =>
      !(p.id === params.id && p.agente.toLowerCase() === session.name.toLowerCase())
  )
  if (filtered.length === all.length) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  writePropiedades(filtered)

  // Unlink any authorizations pointing to this property
  const auths = readAutorizaciones()
  const updatedAuths = auths.map((a: { propiedadId?: string }) =>
    a.propiedadId === params.id ? { ...a, propiedadId: null } : a
  )
  writeAutorizaciones(updatedAuths)

  return NextResponse.json({ ok: true })
}
