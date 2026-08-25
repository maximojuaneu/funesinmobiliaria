'use client'
import { useState, useEffect, useRef } from 'react'
import type { LocationSuggestion } from '@/lib/tokko'

interface Props {
  value:       string
  onChange:    (val: string) => void
  onEnter?:    () => void
  placeholder?: string
  className?:  string
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function LocationAutocomplete({ value, onChange, onEnter, placeholder, className }: Props) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [all,         setAll]         = useState<LocationSuggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [focused,     setFocused]     = useState(-1)
  const wrapRef   = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/locations').then(r => r.json()).then(setAll).catch(() => {})
  }, [])

  useEffect(() => {
    if (!value.trim()) { setSuggestions([]); setOpen(false); return }
    const q = normalize(value)
    const filtered = all.filter(s =>
      normalize(s.name).includes(q) ||
      (s.city && normalize(s.city).includes(q)) ||
      normalize(s.provincia).includes(q)
    ).slice(0, 10)
    setSuggestions(filtered)
    setOpen(filtered.length > 0)
    setFocused(-1)
  }, [value, all])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (s: LocationSuggestion) => {
    onChange(s.searchValue)
    setOpen(false)
    setFocused(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'Enter') onEnter?.(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(f => Math.max(f - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (focused >= 0) select(suggestions[focused])
      else { setOpen(false); onEnter?.() }
    }
    else if (e.key === 'Escape') setOpen(false)
  }

  const highlight = (text: string) => {
    const q = normalize(value)
    const idx = normalize(text).indexOf(q)
    if (idx === -1 || !q) return <span>{text}</span>
    return (
      <>
        {text.slice(0, idx)}
        <strong className="font-bold">{text.slice(idx, idx + value.length)}</strong>
        {text.slice(idx + value.length)}
      </>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        className={className}
        placeholder={placeholder ?? 'Barrio o ciudad'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />

      {open && (
        <ul className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-72 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={`${s.type}-${s.name}-${s.city}`}
              onMouseDown={() => select(s)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer text-sm transition-colors ${
                i === focused ? 'bg-brand-green/10' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-gray-800">
                {highlight(s.name)}
                {s.type === 'barrio' && s.city && (
                  <span className="text-gray-400 font-normal ml-1.5">· {s.city}</span>
                )}
              </span>
              <span className={`ml-3 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                s.type === 'ciudad'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}>
                {s.type === 'ciudad' ? 'Ciudad' : 'Barrio'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
