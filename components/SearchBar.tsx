'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, CalendarDays, User2, Tag, Eraser, Minimize2 } from 'lucide-react'
import type { SearchHit } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'

// helper to broadcast highlight IDs
function emitHighlight(placeIds: string[]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pm:highlight-places', { detail: { placeIds } }))
  }
}
function emitOpenPlacePopup(placeId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pm:open-place-popup', { detail: { placeId } }))
  }
}
function emitClosePopups() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pm:close-popups'))
  }
}

export default function SearchBar() {
  // Core state
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [containerAnim, setContainerAnim] = useState<'enter' | 'idle' | 'leave'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const firstOpenRef = useRef(false)
  // navigation hooks
  const pathname = usePathname()
  const router = useRouter()

  // Animated list state
  type AnimatedItem = { hit: SearchHit; phase: 'enter' | 'idle' | 'leave' }
  const [items, setItems] = useState<AnimatedItem[]>([])
  // Store base placeIds (all places represented in current results)
  const basePlaceIdsRef = useRef<string[]>([])

  // Icon + color mapping (dark near-black tints)
  const typeMeta: Record<SearchHit['type'], { icon: React.ReactNode; bg: string; ring: string; fg: string; label: string }> = {
    place: {
      icon: <MapPin className="h-3.5 w-3.5" />,
      bg: 'bg-emerald-950/70 dark:bg-emerald-900/40',
      ring: 'ring-emerald-500/25',
      fg: 'text-emerald-200',
      label: 'Place'
    },
    event: {
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      bg: 'bg-violet-950/70 dark:bg-violet-900/40',
      ring: 'ring-violet-500/25',
      fg: 'text-violet-200',
      label: 'Event'
    },
    performer: {
      icon: <User2 className="h-3.5 w-3.5" />,
      bg: 'bg-rose-950/70 dark:bg-rose-900/40',
      ring: 'ring-rose-500/25',
      fg: 'text-rose-200',
      label: 'Performer'
    },
    tag: {
      icon: <Tag className="h-3.5 w-3.5" />,
      bg: 'bg-zinc-900/70 dark:bg-zinc-800/50',
      ring: 'ring-zinc-400/25',
      fg: 'text-zinc-200',
      label: 'Tag'
    }
  }

  // New: refetch current query when reopening
  async function refetchCurrentIfNeeded() {
    const q = query.trim()
    if (!q) return
    if (open) return // already open
    // fetch fresh results
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const json = await r.json() as { hits: SearchHit[] }
    const newHits = json.hits
    const placeIds = Array.from(new Set(newHits.map(h => h.placeId).filter(Boolean))) as string[]
    basePlaceIdsRef.current = placeIds
    emitHighlight(placeIds)
    setItems(newHits.map(h => ({ hit: h, phase: 'enter' as const })))
    setOpen(true)
    setContainerAnim('enter')
    firstOpenRef.current = true
  }

  // Outside click
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) closeDropdown()
    }
    document.addEventListener('pointerdown', handlePointerDown, { capture: true })
    return () => document.removeEventListener('pointerdown', handlePointerDown, { capture: true } as any)
  }, [])

  // Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDropdown() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function closeDropdown() {
    // animate container + items leaving
    setContainerAnim('leave')
    // mark all items leaving (if not already)
    setItems(prev => prev.map(it => it.phase === 'leave' ? it : { ...it, phase: 'leave' }))
    setTimeout(() => { setOpen(false); setItems([]); setContainerAnim('idle'); firstOpenRef.current = false }, 260)
  }

  function dismissResults() {
    // Hide dropdown but keep query & highlights; blur to close mobile keyboard
    closeDropdown()
    requestAnimationFrame(() => { inputRef.current?.blur() })
  }

  // Fetch results (debounced) -> diff items, animate enter/leave per item
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim()
      if (!q) { closeDropdown(); emitHighlight([]); return }
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const json = await r.json() as { hits: SearchHit[] }
      const newHits = json.hits

      // collect placeIds from hits (place hits & events referencing place)
      const placeIds = Array.from(new Set(newHits.map(h => h.placeId).filter(Boolean))) as string[]
      basePlaceIdsRef.current = placeIds
      emitHighlight(placeIds)

      setItems(prev => {
        const prevMap = new Map(prev.filter(p => p.phase !== 'leave').map(p => [keyOf(p.hit), p]))
        const nextKeys = new Set(newHits.map(h => keyOf(h)))
        // items staying or entering
        const staying: AnimatedItem[] = newHits.map(h => {
          const k = keyOf(h)
          const existing = prevMap.get(k)
            return existing ? { hit: h, phase: existing.phase === 'leave' ? 'idle' : 'idle' } : { hit: h, phase: 'enter' }
        })
        const leaving: AnimatedItem[] = prev
          .filter(p => !nextKeys.has(keyOf(p.hit)) && p.phase !== 'leave')
          .map(p => ({ ...p, phase: 'leave' }))
        return [...staying, ...leaving]
      })

      // Always ensure dropdown opens for a non-empty query; only animate first open
      if (!firstOpenRef.current) {
        setOpen(true)
        setContainerAnim('enter')
        firstOpenRef.current = true
      } else {
        setOpen(true)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  // Cleanup leaving items after their animation
  useEffect(() => {
    if (!items.some(i => i.phase === 'leave')) return
    const to = setTimeout(() => {
      setItems(prev => prev.filter(i => i.phase !== 'leave'))
    }, 250)
    return () => clearTimeout(to)
  }, [items])

  const showPanel = open
  const puffSeeds = Array.from({ length: 6 }, (_, i) => i)

  const clearAll = () => {
    setQuery('')
    emitHighlight([])
    emitClosePopups()
    setItems([])
    setOpen(false)
    setContainerAnim('idle')
    // Clear cached base highlight IDs so they don't get re-applied on next focus
    basePlaceIdsRef.current = []
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Input */}
      <div className="flex items-center gap-2 rounded-full border border-white/20 dark:border-zinc/50 bg-white/90 dark:bg-zinc-900/70 px-3 py-2 shadow-sm dark:shadow-md backdrop-blur-md transition focus-within:ring-2 focus-within:ring-violet-400/60 dark:focus-within:ring-violet-500/50">
        <Search className="h-5 w-5 text-zinc-700 dark:text-zinc-300" aria-hidden />
        <input
          className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 dark:placeholder-zinc-400 outline-none"
          placeholder="Search places, events, performers, tags"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          ref={inputRef}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (query.trim()) {
                e.preventDefault()
                dismissResults()
              }
            }
          }}
          onFocus={() => {
            emitClosePopups()
            const hasQuery = !!query.trim()
            if (hasQuery) {
              emitHighlight(basePlaceIdsRef.current.length ? basePlaceIdsRef.current : [])
              if (!open) {
                // If we have no items (or only leaving ones) refetch so user sees results again
                if (!items.length || items.every(i => i.phase === 'leave')) {
                  refetchCurrentIfNeeded()
                  return
                }
                setOpen(true)
                setContainerAnim('enter')
                firstOpenRef.current = true
              } else if (items.length) {
                setOpen(true)
              }
            } else {
              // Ensure we do not re-activate stale highlights on focusing an empty field
              emitHighlight([])
            }
          }}
        />
        {query.trim() && (
          (() => {
            const active = open
            return (
              <button
                type="button"
                onClick={active ? dismissResults : undefined}
                title={active ? 'Hide results' : 'Results hidden'}
                aria-label={active ? 'Hide results' : 'Results hidden'}
                aria-disabled={!active}
                className={`flex-shrink-0 inline-flex items-center justify-center rounded-full h-7 w-7 transition-colors focus:outline-none focus-visible:ring-2 ${active
                  ? 'text-white bg-violet-600/80 hover:bg-violet-600 focus-visible:ring-violet-400/60'
                  : 'text-zinc-500 dark:text-zinc-500 opacity-60 pointer-events-none'} `}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            )
          })()
        )}
        <button
          type="button"
          onClick={clearAll}
          title="Clear selection"
          aria-label="Clear selection"
          className="flex-shrink-0 inline-flex items-center justify-center rounded-full h-7 w-7 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
        >
          <Eraser className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown */}
      {showPanel && (
        <div
          className={`absolute left-0 top-full mt-2 w-full max-h-96 overflow-hidden rounded-xl border border-violet-300/50 dark:border-violet-400/20 bg-white/85 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-lg z-[2000] ${containerAnim === 'enter' ? 'smoke-enter' : ''} ${containerAnim === 'leave' ? 'smoke-leave' : ''}`}
          role="listbox"
          onAnimationEnd={(e) => { if (containerAnim === 'enter') setContainerAnim('idle') }}
        >
          {/* Smoke puffs only on container enter */}
          {containerAnim === 'enter' && (
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {puffSeeds.map(i => {
                const delay = i * 35
                const left = 10 + (i * 70) % 100
                const size = 140 + (i % 3) * 60
                return (
                  <span
                    key={i}
                    style={{ animationDelay: `${delay}ms`, left: `${left}%`, width: `${size}px`, height: `${size}px` }}
                    className="absolute top-full -translate-x-1/2 rounded-full bg-gradient-to-tr from-white/40 to-white/5 dark:from-white/10 dark:to-white/0 blur-xl opacity-0 puff"
                  />
                )
              })}
            </div>
          )}

          <div className="relative">
            {items.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">No results for “{query}”</div>
            ) : (
              <ul className="divide-y divide-zinc-300/70 dark:divide-white/10">
                {items.map(({ hit, phase }) => {
                  const meta = typeMeta[hit.type]
                  // Format next date relative local
                  let dateLabel: string | null = null
                  if (hit.nextEventStart) {
                    const d = new Date(hit.nextEventStart)
                    const now = new Date()
                    const sameDay = d.toDateString() === now.toDateString()
                    if (sameDay) dateLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    else {
                      const inYear = d.getFullYear() === now.getFullYear()
                      dateLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric', ...(inYear ? {} : { year: 'numeric' }) })
                    }
                  }
                  const placeIdForFocus = hit.placeId || (hit.type === 'place' ? hit.id : undefined)
                  return (
                    <li
                      key={keyOf(hit)}
                      className={`item ${phase === 'enter' ? 'item-enter' : ''} ${phase === 'leave' ? 'item-leave' : ''}`}
                    >
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-violet-50/70 dark:hover:bg-violet-900/30 transition-colors">
                        <button
                          type="button"
                          onClick={() => {
                            if (placeIdForFocus) {
                              if (pathname !== '/') {
                                router.push(`/?focus=${encodeURIComponent(placeIdForFocus)}`)
                                closeDropdown()
                                return
                              }
                              emitHighlight([placeIdForFocus])
                              emitOpenPlacePopup(placeIdForFocus)
                              closeDropdown()
                            } else {
                              // No place to focus (e.g. tag); fallback to navigation
                              router.push(hit.href)
                              closeDropdown()
                            }
                          }}
                          className="flex flex-1 items-center gap-3 min-w-0 text-left group focus:outline-none"
                        >
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-white/20 group-hover:ring-violet-400/50 transition-colors">
                            <Image src={hit.image} alt={hit.title} fill sizes="40px" className="object-cover" />
                            <span className="absolute bottom-0 left-0 right-0 text-[10px] font-medium uppercase tracking-wide bg-black/40 text-white text-center leading-tight">{hit.type.charAt(0)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">{hit.title}</span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ring-1 ${meta.bg} ${meta.ring} ${meta.fg}`}>
                                {meta.icon}
                                {meta.label}
                              </span>
                            </div>
                            <div className="truncate text-xs text-zinc-600 dark:text-zinc-300">{hit.subtitle}</div>
                          </div>
                          {dateLabel && (
                            <div className="ml-3 hidden sm:flex flex-col items-end text-right">
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 tabular-nums">{dateLabel}</span>
                            </div>
                          )}
                        </button>
                        <Link
                          href={hit.href}
                          onClick={(e) => { e.stopPropagation(); closeDropdown() }}
                          className="ml-2 flex-shrink-0 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium
                                     border border-violet-400/50 text-violet-700 dark:text-violet-200 bg-white/60 dark:bg-zinc-900/40
                                     hover:bg-violet-50/80 dark:hover:bg-violet-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 shadow-sm"
                        >
                          View
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function keyOf(hit: SearchHit) { return `${hit.type}-${hit.id}` }
