import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH  = path.join(process.cwd(), 'data', 'funes.db')
const DATA_DIR = path.join(process.cwd(), 'data')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL') // concurrent reads while writing
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  migrateFromJson(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autorizaciones (
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
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      dueDate     TEXT NOT NULL DEFAULT '',
      assignedTo  TEXT NOT NULL,
      createdBy   TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      priority    TEXT NOT NULL DEFAULT 'medium',
      createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS closed_operations (
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
    );

    CREATE TABLE IF NOT EXISTS prop_docs (
      propId   TEXT PRIMARY KEY,
      folderId TEXT NOT NULL,
      address  TEXT NOT NULL DEFAULT '',
      city     TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS propiedades (
      id        TEXT PRIMARY KEY,
      agente    TEXT NOT NULL,
      direccion TEXT NOT NULL,
      ciudad    TEXT NOT NULL DEFAULT 'Funes',
      tipo      TEXT NOT NULL DEFAULT '',
      precio    TEXT NOT NULL DEFAULT '',
      notas     TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS paper_auth (
      propId    TEXT PRIMARY KEY,
      marcadaEn TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

function readJson<T>(filename: string): T | null {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8')) as T }
  catch { return null }
}

function count(db: Database.Database, table: string): number {
  return (db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get() as { n: number }).n
}

function migrateFromJson(db: Database.Database) {
  // autorizaciones
  if (count(db, 'autorizaciones') === 0) {
    const rows = readJson<Record<string, unknown>[]>('autorizaciones.json')
    if (rows?.length) {
      const ins = db.prepare(`
        INSERT OR IGNORE INTO autorizaciones
          (id,agenteNombre,agenteEmail,agenteTel,inmuebleDir,inmuebleCiudad,
           provincia,partida,precio,precioLetras,comision,vigencia,exclusividad,
           fecha,titularNombre,titularDNI,titularTel,titularEmail,fechaFirma,
           propiedadId,firmaDataUrl)
        VALUES
          (@id,@agenteNombre,@agenteEmail,@agenteTel,@inmuebleDir,@inmuebleCiudad,
           @provincia,@partida,@precio,@precioLetras,@comision,@vigencia,@exclusividad,
           @fecha,@titularNombre,@titularDNI,@titularTel,@titularEmail,@fechaFirma,
           @propiedadId,@firmaDataUrl)
      `)
      db.transaction((data: Record<string, unknown>[]) => {
        for (const r of data) ins.run({ ...r, exclusividad: r.exclusividad ? 1 : 0, firmaDataUrl: r.firmaDataUrl ?? '', propiedadId: r.propiedadId ?? null })
      })(rows)
    }
  }

  // tasks
  if (count(db, 'tasks') === 0) {
    const rows = readJson<Record<string, unknown>[]>('tasks.json')
    if (rows?.length) {
      const ins = db.prepare(`
        INSERT OR IGNORE INTO tasks (id,title,description,dueDate,assignedTo,createdBy,status,priority,createdAt)
        VALUES (@id,@title,@description,@dueDate,@assignedTo,@createdBy,@status,@priority,@createdAt)
      `)
      db.transaction((data: Record<string, unknown>[]) => { for (const r of data) ins.run(r) })(rows)
    }
  }

  // closed_operations
  if (count(db, 'closed_operations') === 0) {
    const rows = readJson<Record<string, unknown>[]>('closed-operations.json')
    if (rows?.length) {
      const ins = db.prepare(`
        INSERT OR IGNORE INTO closed_operations
          (id,address,lat,lng,fecha,tipo,valorPublicacion,valorCierre,
           tiempoComercializacion,captador,vendedor,status,creadaPor,creadaEn,source,photoUrl,tokkoId)
        VALUES
          (@id,@address,@lat,@lng,@fecha,@tipo,@valorPublicacion,@valorCierre,
           @tiempoComercializacion,@captador,@vendedor,@status,@creadaPor,@creadaEn,@source,@photoUrl,@tokkoId)
      `)
      db.transaction((data: Record<string, unknown>[]) => {
        for (const r of data) ins.run({ source: 'manual', photoUrl: '', tokkoId: null, ...r })
      })(rows)
    }
  }

  // prop_docs (stored as dict keyed by propId in JSON)
  if (count(db, 'prop_docs') === 0) {
    const docs = readJson<Record<string, { folderId: string; address: string; city: string }>>('prop-docs.json')
    if (docs && Object.keys(docs).length) {
      const ins = db.prepare(`INSERT OR IGNORE INTO prop_docs (propId,folderId,address,city) VALUES (@propId,@folderId,@address,@city)`)
      db.transaction((entries: [string, { folderId: string; address: string; city: string }][]) => {
        for (const [propId, doc] of entries) ins.run({ propId, ...doc })
      })(Object.entries(docs))
    }
  }

  // propiedades
  if (count(db, 'propiedades') === 0) {
    const rows = readJson<Record<string, unknown>[]>('propiedades.json')
    if (rows?.length) {
      const ins = db.prepare(`
        INSERT OR IGNORE INTO propiedades (id,agente,direccion,ciudad,tipo,precio,notas,createdAt)
        VALUES (@id,@agente,@direccion,@ciudad,@tipo,@precio,@notas,@createdAt)
      `)
      db.transaction((data: Record<string, unknown>[]) => { for (const r of data) ins.run(r) })(rows)
    }
  }
}
