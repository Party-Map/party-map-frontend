'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Search, Minimize2, Eraser } from 'lucide-react'
import type { SearchHit } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'
import {SearchResultListItem} from "@/components/SearchResultListItem";

function emitHighlight(placeIds: string[]) {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('pm:highlight-places', { detail: { placeIds } }))
}

export default function SearchBar() {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<SearchHit[]>([])
    const rootRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const pathname = usePathname()
    const router = useRouter()

    // outside click
    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current) return
            if (!rootRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('pointerdown', onPointerDown, { capture: true })
        return () =>
            document.removeEventListener('pointerdown', onPointerDown as any, {
                capture: true,
            } as any)
    }, [])

    // escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [])

    // debounced search
    useEffect(() => {
        const q = query.trim()
        if (!q) {
            setItems([])
            setOpen(false)
            emitHighlight([])
            return
        }

        const t = setTimeout(async () => {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
            const json = (await res.json()) as { hits: SearchHit[] }
            setItems(json.hits)

            const placeIds = Array.from(
                new Set(
                    json.hits
                        .map(h => h.placeId || (h.type === 'place' ? h.id : null))
                        .filter(Boolean),
                ),
            ) as string[]
            emitHighlight(placeIds)
            setOpen(true)
        }, 200)

        return () => clearTimeout(t)
    }, [query])

    const clearAll = () => {
        setQuery('')
        setItems([])
        setOpen(false)
        emitHighlight([])
    }

    const dismissResults = () => {
        setOpen(false)
        requestAnimationFrame(() => inputRef.current?.blur())
    }

    const handlePrimaryClick = (hit: SearchHit) => {
        const placeIdForFocus = hit.placeId || (hit.type === 'place' ? hit.id : undefined)

        if (placeIdForFocus) {
            if (pathname !== '/') {
                router.push(`/?focus=${encodeURIComponent(placeIdForFocus)}`)
            } else {
                emitHighlight([placeIdForFocus])
            }
        } else {
            router.push(hit.href)
        }
        dismissResults()
    }

    const handleViewClick = () => {
        dismissResults()
    }

    return (
        <div ref={rootRef} className="relative">
            {/* Input */}
            <div className="flex items-center gap-2 rounded-full border border-white/20 dark:border-zinc/50 bg-white/90 dark:bg-zinc-900/70 px-3 py-2 shadow-sm dark:shadow-md backdrop-blur-md transition focus-within:ring-2 focus-within:ring-violet-400/60 dark:focus-within:ring-violet-500/50">
                <Search className="h-5 w-5 text-zinc-700 dark:text-zinc-300" aria-hidden />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => {
                        if (items.length) setOpen(true)
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && query.trim()) {
                            e.preventDefault()
                            dismissResults()
                        }
                    }}
                    placeholder="Search places, events, performers, tags"
                    className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 dark:placeholder-zinc-400 outline-none"
                />
                {query.trim() && (
                    <button
                        type="button"
                        onClick={open ? dismissResults : undefined}
                        aria-label={open ? 'Hide results' : 'Results hidden'}
                        aria-disabled={!open}
                        className={`flex-shrink-0 inline-flex items-center justify-center rounded-full h-7 w-7 transition-colors focus:outline-none focus-visible:ring-2 ${
                            open
                                ? 'text-white bg-violet-600/80 hover:bg-violet-600 focus-visible:ring-violet-400/60'
                                : 'text-zinc-500 dark:text-zinc-500 opacity-60 pointer-events-none'
                        }`}
                    >
                        <Minimize2 className="h-4 w-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={clearAll}
                    aria-label="Clear selection"
                    className="flex-shrink-0 inline-flex items-center justify-center rounded-full h-7 w-7 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                >
                    <Eraser className="h-4 w-4" />
                </button>
            </div>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute left-0 top-full mt-2 w-full max-h-96 overflow-auto rounded-xl border border-violet-300/50 dark:border-violet-400/20 bg-white/85 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-lg z-[2000]"
                    role="listbox"
                >
                    {items.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                            No results for “{query}”
                        </div>
                    ) : (
                        <ul className="divide-y divide-zinc-300/70 dark:divide-white/10">
                            {items.map(hit => (
                                <SearchResultListItem
                                    key={hit.id}
                                    hit={hit}
                                    onPrimaryClick={() => handlePrimaryClick(hit)}
                                    onViewClick={handleViewClick}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
