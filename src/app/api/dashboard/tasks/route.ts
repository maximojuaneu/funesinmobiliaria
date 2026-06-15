import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export interface TaskRecord {
  id:          string
  title:       string
  description: string
  dueDate:     string
  assignedTo:  string
  createdBy:   string
  status:      'pending' | 'done'
  priority:    'high' | 'medium' | 'low'
  createdAt:   string
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const agentParam = new URL(req.url).searchParams.get('agent')
  const db = getDb()

  let tasks: unknown[]
  if (session.role === 'admin') {
    tasks = agentParam
      ? db.prepare('SELECT * FROM tasks WHERE assignedTo = ?').all(agentParam)
      : db.prepare('SELECT * FROM tasks').all()
  } else {
    tasks = db.prepare('SELECT * FROM tasks WHERE assignedTo = ?').all(session.name)
  }

  ;(tasks as TaskRecord[]).sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return b.createdAt.localeCompare(a.createdAt)
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body       = await req.json()
  const assignedTo = session.role === 'admin'
    ? String(body.assignedTo ?? session.name).trim()
    : session.name

  const task: TaskRecord = {
    id:          crypto.randomUUID(),
    title:       String(body.title       ?? '').trim(),
    description: String(body.description ?? '').trim(),
    dueDate:     String(body.dueDate     ?? '').trim(),
    assignedTo,
    createdBy:   session.name,
    status:      'pending',
    priority:    ['high', 'medium', 'low'].includes(body.priority) ? body.priority : 'medium',
    createdAt:   new Date().toISOString(),
  }

  if (!task.title) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })

  getDb().prepare(`
    INSERT INTO tasks (id,title,description,dueDate,assignedTo,createdBy,status,priority,createdAt)
    VALUES (@id,@title,@description,@dueDate,@assignedTo,@createdBy,@status,@priority,@createdAt)
  `).run(task)

  return NextResponse.json({ ok: true, task })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, status } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const db   = getDb()
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRecord | undefined
  if (!task) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (session.role !== 'admin' && task.assignedTo !== session.name) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  if (status && ['pending', 'done'].includes(status)) {
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, id)
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  return NextResponse.json({ ok: true, task: updated })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  const db     = getDb()
  const task   = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRecord | undefined
  if (!task) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (session.role !== 'admin' && task.createdBy !== session.name) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
