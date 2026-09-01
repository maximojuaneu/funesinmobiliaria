'use client'
import { useState, useEffect, useRef } from 'react'
import type { LocationSuggestion } from '@/lib/tokko'

interface SingleProps {
  value:       string
  onChange:    (val: string) => void
  onEnter?:    (newValues?: string[]) => void
  placeholder?: string
  className?:  string
  // multi mode not used
  values?:         never
  onChangeMulti?:  never
  maxValues?:      never
}

interface MultiProps {
  values:          string[]
  onChangeMulti:   (vals: string[]) => void
  onEnter?:        (newValues?: string[]) => void
  placeholder?:    string
  className?:      string
  maxValues?:      number
  // single mode not used
  value?:    never
  onChange?: never
}

type Props = SingleProps | MultiProps

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function LocationAutocomplete(props: Props) {
  const isMulti = props.values !== undefined

  // Single-mode state
  const singleValue   = isMulti ? '' : (props.value ?? '')
  const onSingleChange = isMulti ? undefined : props.onChange

  // Multi-mode state
  const multiValues    = isMulti ? props.values! : undefined
  const onMultiChange  = isMulti ? props.onChangeMulti! : undefined
  const maxValues      = isMulti ? (props.maxValues ?? 3) : 1

  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [all,         setAll]         = useState<LocationSuggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [focused,     setFocused]     = useState(-1)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/locations').then(r => r.json()).then(setAll).catch(() => {})
  }, [])

  // For single mode, the "query" is the controlled value
  const searchTerm = isMulti ? query : singleValue

  useEffect(() => {
    if (!searchTerm.trim()) { setSuggestions([]); setOpen(false); return }
    const q = normalize(searchTerm)
    const filtered = all.filter(s => {
      // In multi mode, exclude already-selected
      if (isMulti && multiValues!.some(v => normalize(v) === normalize(s.searchValue))) return false
      return (
        normalize(s.name).includes(q) ||
        (s.city && normalize(s.city).includes(q)) ||
        normalize(s.provincia).includes(q)
      )
    }).slice(0, 10)
    setSuggestions(filtered)
    setOpen(filtered.length > 0)
    setFocused(-1)
  }, [searchTerm, all]) // eslint-disable-line react-hooks/exhaustive-deps

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
    if (isMulti) {
      if (multiValues!.length < maxValues) {
        onMultiChange!([...multiValues!, s.searchValue])
      }
      setQuery('')
    } else {
      onSingleChange!(s.searchValue)
    }
    setOpen(false)
    setFocused(-1)
    inputRef.current?.focus()
  }

  const removeTag = (val: string) => {
    onMultiChange!(multiValues!.filter(v => v !== val))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isMulti && e.key === 'Backspace' && query === '' && multiValues!.length > 0) {
      onMultiChange!(multiValues!.slice(0, -1))
      return
    }
    if (!open) { if (e.key === 'Enter') props.onEnter?.(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(f => Math.max(f - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const chosen = focused >= 0 ? suggestions[focused] : suggestions[0]
      if (chosen) {
        if (isMulti && multiValues!.length < maxValues) {
          const newVals = [...multiValues!, chosen.searchValue]
          onMultiChange!(newVals)
          setQuery('')
          setOpen(false)
          props.onEnter?.(newVals)
        } else if (!isMulti) {
          select(chosen)
          props.onEnter?.()
        }
      } else {
        setOpen(false)
        props.onEnter?.()
      }
    }
    else if (e.key === 'Escape') setOpen(false)
  }

  const highlight = (text: string) => {
    const q = normalize(searchTerm)
    const idx = normalize(text).indexOf(q)
    if (idx === -1 || !q) return <span>{text}</span>
    return (
      <>
        {text.slice(0, idx)}
        <strong className="font-bold">{text.slice(idx, idx + searchTerm.length)}</strong>
        {text.slice(idx + searchTerm.length)}
      </>
    )
  }

  const canAddMore = isMulti ? multiValues!.length < maxValues : true

  // ── Single mode (original) ───────────────────────────────────────────────
  if (!isMulti) {
    return (
      <div ref={wrapRef} className="relative">
        <input
          ref={inputRef}
          className={props.className}
          placeholder={props.placeholder ?? 'Barrio o ciudad'}
          value={singleValue}
          onChange={e => onSingleChange!(e.target.value)}
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
                  s.type === 'ciudad' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
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

  // ── Multi mode ───────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`${props.className ?? ''} flex flex-wrap items-center gap-1.5 cursor-text min-h-[42px] h-auto py-1.5`}
        onClick={() => inputRef.current?.focus()}
      >
        {multiValues!.map(val => (
          <span key={val} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-sm font-medium px-2.5 py-0.5 rounded-lg shrink-0">
            {val}
            <button
              type="button"
              onMouseDown={e => { e.stopPropagation(); removeTag(val) }}
              className="text-gray-400 hover:text-gray-700 transition-colors leading-none"
              aria-label={`Quitar ${val}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </span>
        ))}
        {canAddMore && (
          <input
            ref={inputRef}
            className="flex-1 min-w-[80px] outline-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400"
            placeholder={multiValues!.length === 0 ? (props.placeholder ?? 'Barrio o ciudad') : 'Agregar...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            autoComplete="off"
          />
        )}
      </div>

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
                s.type === 'ciudad' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
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
