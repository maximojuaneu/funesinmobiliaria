import { createClient, type Client } from '@libsql/client'

let _client: Client | null = null

export function getDb(): Client {
  if (_client) return _client
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error('TURSO_DATABASE_URL is not set')
  _client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  return _client
}

export const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS autorizaciones (
    id             TEXT PRIMARY KEY,
    agenteNombre   TEXT NOT NULL DEFAULT '',
    agenteEmail    TEXT NOT NULL DEFAULT '',
    agenteTel      TEXT NOT NULL DEFAULT '',
    inmuebleDir    TEXT NOT NULL DEFAULT '',
    inmuebleCiudad TEXT NOT NULL DEFAULT '',
    provincia      TEXT NOT NULL DEFAULT 'Santa Fe',
    partida        TEXT NOT NULL DEFAULT '',
    precio         TEXT NOT NULL DEFAULT '',
    precioLetras   TEXT NOT NULL DEFAULT '',
    comision       TEXT NOT NULL DEFAULT '3',
    vigencia       TEXT NOT NULL DEFAULT '180',
    exclusividad   INTEGER NOT NULL DEFAULT 0,
    fecha          TEXT NOT NULL DEFAULT '',
    titularNombre  TEXT NOT NULL DEFAULT '',
    titularDNI     TEXT NOT NULL DEFAULT '',
    titularTel     TEXT NOT NULL DEFAULT '',
    titularEmail   TEXT NOT NULL DEFAULT '',
    fechaFirma     TEXT NOT NULL DEFAULT '',
    propiedadId    TEXT,
    firmaDataUrl   TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    dueDate     TEXT NOT NULL DEFAULT '',
    assignedTo  TEXT NOT NULL,
    createdBy   TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    priority    TEXT NOT NULL DEFAULT 'medium',
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS closed_operations (
    id                     TEXT PRIMARY KEY,
    address                TEXT NOT NULL,
    lat                    REAL NOT NULL,
    lng                    REAL NOT NULL,
    fecha                  TEXT NOT NULL DEFAULT '',
    tipo                   TEXT NOT NULL DEFAULT '',
    valorPublicacion       REAL NOT NULL DEFAULT 0,
    valorCierre            REAL NOT NULL DEFAULT 0,
    tiempoComercializacion REAL NOT NULL DEFAULT 0,
    captador               TEXT NOT NULL DEFAULT '',
    vendedor               TEXT NOT NULL DEFAULT '',
    status                 TEXT NOT NULL DEFAULT 'RESERVADA',
    creadaPor              TEXT NOT NULL DEFAULT '',
    creadaEn               TEXT NOT NULL DEFAULT '',
    source                 TEXT NOT NULL DEFAULT 'manual',
    photoUrl               TEXT NOT NULL DEFAULT '',
    tokkoId                INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS prop_docs (
    propId   TEXT PRIMARY KEY,
    folderId TEXT NOT NULL,
    address  TEXT NOT NULL DEFAULT '',
    city     TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS propiedades (
    id        TEXT PRIMARY KEY,
    agente    TEXT NOT NULL,
    direccion TEXT NOT NULL,
    ciudad    TEXT NOT NULL DEFAULT 'Funes',
    tipo      TEXT NOT NULL DEFAULT '',
    precio    TEXT NOT NULL DEFAULT '',
    notas     TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS paper_auth (
    propId    TEXT PRIMARY KEY,
    marcadaEn TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS firma_pending (
    id        TEXT PRIMARY KEY,
    data      TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
]
