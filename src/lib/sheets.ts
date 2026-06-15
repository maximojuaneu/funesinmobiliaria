import { google } from 'googleapis'

const SHEET_ID = process.env.GOOGLE_SHEETS_ID ?? ''

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export interface PropertyContact {
  fecha: string
  propiedadId: string
  agente: string
  tipo: string        // 'venta' | 'alquiler'
  origen: string      // 'whatsapp' | 'llamada'
  direccion: string
}

export interface GeneralContact {
  fecha: string
  consulta: string    // raw value from the form dropdown
}

export async function appendPropertyContactToSheet(data: {
  propiedadId: string
  agente: string
  tipo: string
  origen: string
  direccion: string
}) {
  const auth   = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const now    = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Consultas_Web!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[
      now,
      data.propiedadId,
      data.agente,
      data.tipo,
      data.origen,
      data.direccion,
    ]] },
  })
}

export async function readPropertyContacts(): Promise<PropertyContact[]> {
  try {
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const res    = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Consultas_Web!A:F',
    })
    const rows = res.data.values ?? []
    return rows.map(r => ({
      fecha:       r[0] ?? '',
      propiedadId: r[1] ?? '',
      agente:      r[2] ?? '',
      tipo:        r[3] ?? '',
      origen:      r[4] ?? '',
      direccion:   r[5] ?? '',
    }))
  } catch { return [] }
}

export async function readGeneralContacts(): Promise<GeneralContact[]> {
  try {
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const res    = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Contactos!A:F',
    })
    const rows = res.data.values ?? []
    return rows.map(r => ({
      fecha:    r[0] ?? '',
      consulta: r[4] ?? '',   // column E = consulta
    }))
  } catch { return [] }
}

export async function appendLeadToSheet(data: Record<string, string>) {
  const sheetId   = process.env.GOOGLE_TASACIONES_SHEET_ID ?? ''
  const sheetName = process.env.GOOGLE_TASACIONES_SHEET_NAME ?? 'SOLICITUD TASACIONES'
  if (!sheetId) throw new Error('No tasaciones sheet ID configured')

  const auth   = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // Timestamp format matching Google Forms: dd/mm/yyyy h:mm:ss
  const now = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
    hour12: false,
  })

  // Columns match exactly the Google Form response sheet order (A→H)
  const row = [
    now,                       // A: Marca temporal
    data.nombre     ?? '',     // B: Nombre Completo
    data.motivo     ?? '',     // C: Motivo de tasación
    data.tipo       ?? '',     // D: Tipo de propiedad
    data.direccion  ?? '',     // E: Dirección del inmueble y ciudad
    data.telefono   ?? '',     // F: Telefono de contacto
    data.email      ?? '',     // G: Dirección de email
    data.detalles   ?? '',     // H: Detalles adicionales / observaciones
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `'${sheetName}'!A:H`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}

export interface AgentObjective {
  name: string
  obj_q1: number; obj_q2: number; obj_q3: number; obj_q4: number
  cum_q1: number; cum_q2: number; cum_q3: number; cum_q4: number
  objAnual: number
  facturacionAnual: number
  pctCumplimiento: number
}

function parseMoney(raw: string): number {
  if (!raw) return 0
  // "U$S 8.000" → 8000, "12%" → 12, "U$S 0" → 0
  const clean = raw.replace(/[U$S%\s.]/g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

const MONTH_TO_QUARTER: Record<string, 1 | 2 | 3 | 4> = {
  enero: 1, febrero: 1, marzo: 1,
  abril: 2, mayo: 2, junio: 2,
  julio: 3, agosto: 3, septiembre: 3,
  octubre: 4, noviembre: 4, diciembre: 4,
}

export interface AgentOperationCounts {
  name: string
  q1: number; q2: number; q3: number; q4: number
  total: number
}

export async function readTeamOperations(): Promise<AgentOperationCounts[]> {
  try {
    const objSheetId = process.env.GOOGLE_OBJECTIVES_SHEET_ID ?? process.env.GOOGLE_SHEETS_ID ?? ''
    if (!objSheetId) return []
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const res    = await sheets.spreadsheets.values.get({
      spreadsheetId: objSheetId,
      range: "'SEGUIMIENTOS DE VENTAS'!A1:G300",
    })
    const rows = res.data.values ?? []
    const counts: Record<string, { q1:number; q2:number; q3:number; q4:number }> = {}

    for (const row of rows) {
      // Col B (index 1) = MES, Col G (index 6) = VENDEDORES
      const mes      = (row[1] ?? '').toString().trim().toLowerCase()
      const vendCell = (row[6] ?? '').toString().trim()
      if (!mes || !vendCell) continue
      const quarter = MONTH_TO_QUARTER[mes]
      if (!quarter) continue  // skip header / separator rows

      // Split by " y " to support two vendors per operation
      const vendors = vendCell.split(' y ').map((v: string) => v.trim()).filter(Boolean)
      for (const vendor of vendors) {
        if (!counts[vendor]) counts[vendor] = { q1:0, q2:0, q3:0, q4:0 }
        counts[vendor][`q${quarter}` as 'q1'|'q2'|'q3'|'q4']++
      }
    }

    return Object.entries(counts).map(([name, c]) => ({
      name,
      q1: c.q1, q2: c.q2, q3: c.q3, q4: c.q4,
      total: c.q1 + c.q2 + c.q3 + c.q4,
    })).sort((a, b) => b.total - a.total)
  } catch { return [] }
}

export async function readIndividualObjectives(): Promise<AgentObjective[]> {
  try {
    const objSheetId = process.env.GOOGLE_OBJECTIVES_SHEET_ID ?? process.env.GOOGLE_SHEETS_ID ?? ''
    if (!objSheetId) return []
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const res    = await sheets.spreadsheets.values.get({
      spreadsheetId: objSheetId,
      range: "'OBJETIVOS INDIVIDUALES EQUIPO'!A1:L30",
    })
    const rows = res.data.values ?? []
    // First 2 rows are merged headers — data starts at row 3 (index 2)
    return rows.slice(2)
      .filter(r => {
        const name = r[0]?.toString().trim() ?? ''
        return name && !name.startsWith('Vendedor') && name.toUpperCase() !== 'TOTALES'
      })
      .map(r => ({
        name:             r[0]?.toString().trim() ?? '',
        obj_q1:           parseMoney(r[1]?.toString() ?? ''),
        obj_q2:           parseMoney(r[2]?.toString() ?? ''),
        obj_q3:           parseMoney(r[3]?.toString() ?? ''),
        obj_q4:           parseMoney(r[4]?.toString() ?? ''),
        cum_q1:           parseMoney(r[5]?.toString() ?? ''),
        cum_q2:           parseMoney(r[6]?.toString() ?? ''),
        cum_q3:           parseMoney(r[7]?.toString() ?? ''),
        cum_q4:           parseMoney(r[8]?.toString() ?? ''),
        objAnual:         parseMoney(r[9]?.toString() ?? ''),
        facturacionAnual: parseMoney(r[10]?.toString() ?? ''),
        pctCumplimiento:  parseMoney(r[11]?.toString() ?? ''),
      }))
  } catch { return [] }
}

export async function appendPostulationToSheet(data: Record<string, string>) {
  const sheetId = process.env.GOOGLE_POSTULACIONES_SHEET_ID ?? ''
  if (!sheetId) throw new Error('No postulaciones sheet ID configured')
  const auth   = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // Match exact timestamp format used by Google Forms: dd/mm/yyyy h:mm:ss
  const now = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
    hour12: false,
  })

  // Columns match exactly the Google Form response sheet order (A→S)
  const row = [
    now,                          // A: Marca temporal
    data.nombre        ?? '',     // B: Nombre
    data.edad          ?? '',     // C: Edad
    data.whatsapp      ?? '',     // D: WhatsApp
    data.email         ?? '',     // E: Email
    data.instagram     ?? '',     // F: Instagram
    data.ciudad        ?? '',     // G: Ciudad y barrio
    data.corredor      ?? '',     // H: ¿Sos corredor?
    data.profesion     ?? '',     // I: Profesión (si aplica)
    data.comision      ?? '',     // J: Modalidad comisión
    data.experiencia   ?? '',     // K: Experiencia inmobiliaria
    data.movilidad     ?? '',     // L: Movilidad propia
    data.club          ?? '',     // M: Club
    data.colegio       ?? '',     // N: Colegio secundario
    data.personalidad  ?? '',     // O: Personalidad
    data.motivacion    ?? '',     // P: Motivación independencia
    data.emprendimiento ?? '',    // Q: Emprendimientos
    data.fulltime      ?? '',     // R: Dedicación full time
    data.respaldo      ?? '',     // S: Respaldo económico
    'Página web',                 // T: Origen
  ]

  const sheetName = process.env.GOOGLE_POSTULACIONES_SHEET_NAME ?? 'Respuestas de formulario 1'

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `'${sheetName}'!A:T`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}

export async function appendContactToSheet(data: Record<string, string>) {
  const auth   = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const now    = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })

  const row = [
    now,
    data.nombre    ?? '',
    data.telefono  ?? '',
    data.email     ?? '',
    data.consulta  ?? '',
    data.mensaje   ?? '',
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Contactos!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}
