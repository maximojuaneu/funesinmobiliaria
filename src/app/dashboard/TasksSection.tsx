'use client'
import { useState, useEffect, useCallback } from 'react'
import type { TaskRecord } from '@/app/api/dashboard/tasks/route'

const PRIORITY_STYLES = {
  high:   { dot: 'bg-red-400',    label: 'Alta',  text: 'text-red-600'   },
  medium: { dot: 'bg-amber-400',  label: 'Media', text: 'text-amber-600' },
  low:    { dot: 'bg-gray-300',   label: 'Baja',  text: 'text-gray-500'  },
}

const EMPTY_FORM = {
  title: '', description: '', dueDate: '', assignedTo: '', priority: 'medium' as 'high'|'medium'|'low',
}

interface Props {
  isAdmin: boolean
  sessionName: string
  agents: { id: number; name: string }[]
}

export default function TasksSection({ isAdmin, sessionName, agents }: Props) {
  const [tasks, setTasks]         = useState<TaskRecord[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [filterAgent, setFilterAgent] = useState('')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const url = isAdmin && filterAgent
      ? `/api/dashboard/tasks?agent=${encodeURIComponent(filterAgent)}`
      : '/api/dashboard/tasks'
    const res = await fetch(url)
    if (res.ok) setTasks(await res.json())
    setLoading(false)
  }, [isAdmin, filterAgent])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const toggleStatus = async (task: TaskRecord) => {
    const newStatus = task.status === 'pending' ? 'done' : 'pending'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    await fetch('/api/dashboard/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: newStatus }),
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch('/api/dashboard/tasks', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await fetch('/api/dashboard/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        assignedTo: isAdmin ? (form.assignedTo || sessionName) : sessionName,
      }),
    })
    setSaving(false)
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchTasks()
  }

  const pending = tasks.filter(t => t.status === 'pending')
  const done    = tasks.filter(t => t.status === 'done')

  const isOverdue = (dueDate: string) =>
    dueDate && dueDate < new Date().toISOString().slice(0, 10)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-900">Tareas pendientes</h2>
          {pending.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && agents.length > 0 && (
            <select
              className="input-field text-xs py-1.5 w-40"
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
            >
              <option value="">Todos los agentes</option>
              {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="btn-primary text-xs py-1.5 px-3"
          >
            {showForm ? 'Cancelar' : '+ Nueva tarea'}
          </button>
        </div>
      </div>

      {/* New task form */}
      {showForm && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <input
                className="input-field text-sm"
                placeholder="Título de la tarea *"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <input
              className="input-field text-sm"
              placeholder="Descripción (opcional)"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="input-field text-sm"
                value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              />
              <select
                className="input-field text-sm"
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value as any }))}
              >
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            {isAdmin && (
              <select
                className="input-field text-sm"
                value={form.assignedTo}
                onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
              >
                <option value="">Asignar a… (yo mismo)</option>
                {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar tarea'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="text-sm text-gray-400 hover:text-gray-600 px-3"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="divide-y divide-gray-50 flex-1">
        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Cargando...</div>
        ) : tasks.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No hay tareas pendientes.{' '}
            <button onClick={() => setShowForm(true)} className="text-brand-green hover:underline">
              Crear una
            </button>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.map(task => {
              const p = PRIORITY_STYLES[task.priority]
              const overdue = isOverdue(task.dueDate)
              return (
                <div key={task.id} className="px-6 py-3.5 flex items-start gap-3 group hover:bg-gray-50/60">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleStatus(task)}
                    className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 hover:border-brand-green transition-colors"
                  />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{task.title}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${p.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{p.label}
                      </span>
                      {overdue && (
                        <span className="text-xs text-red-500 font-semibold">⚠ Vencida</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {task.dueDate && (
                        <span className={overdue ? 'text-red-400 font-medium' : ''}>
                          📅 {task.dueDate}
                        </span>
                      )}
                      {isAdmin && task.assignedTo !== sessionName && (
                        <span>👤 {task.assignedTo}</span>
                      )}
                      {task.createdBy !== task.assignedTo && (
                        <span className="text-gray-300">por {task.createdBy}</span>
                      )}
                    </div>
                  </div>
                  {/* Delete — admin or creator */}
                  {(isAdmin || task.createdBy === sessionName) && (
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs mt-1"
                    >✕</button>
                  )}
                </div>
              )
            })}

            {/* Done tasks — collapsed by default */}
            {done.length > 0 && (
              <details className="group">
                <summary className="px-6 py-2.5 text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none list-none flex items-center gap-1.5">
                  <svg className="w-3 h-3 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  {done.length} tarea{done.length !== 1 ? 's' : ''} completada{done.length !== 1 ? 's' : ''}
                </summary>
                {done.map(task => (
                  <div key={task.id} className="px-6 py-3 flex items-start gap-3 group/done hover:bg-gray-50/40 opacity-60">
                    <button
                      onClick={() => toggleStatus(task)}
                      className="mt-0.5 w-5 h-5 rounded-full bg-brand-green/20 border-2 border-brand-green flex-shrink-0 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-500 line-through">{task.title}</span>
                      {isAdmin && task.assignedTo !== sessionName && (
                        <p className="text-xs text-gray-400 mt-0.5">👤 {task.assignedTo}</p>
                      )}
                    </div>
                    {(isAdmin || task.createdBy === sessionName) && (
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="opacity-0 group-hover/done:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs mt-1"
                      >✕</button>
                    )}
                  </div>
                ))}
              </details>
            )}
          </>
        )}
      </div>
    </div>
  )
}
