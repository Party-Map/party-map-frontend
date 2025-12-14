'use client'

import React, {useCallback, useContext, useEffect, useRef, useState,} from 'react'
import {Eraser, Minimize2, Search} from 'lucide-react'
import type {SearchHit} from '@/lib/types'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {SearchResultListItem} from '@/components/SearchResultListItem'
import {useHighlight} from '@/app/HighlightContextProvider'
import {SessionContext} from '@/lib/auth/SessionContextProvider'
import {fetchSearch} from '@/lib/api/search'

function useDebouncedValue(value: String) {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), 300)
        return () => clearTimeout(id)
    }, [value])

    return debounced
}

export default function SearchBar() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()

    const hasFocusParam = Boolean(searchParams.get('focus'))

    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<SearchHit[]>([])

    const rootRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const lastUrlQRef = useRef<string | null>(null)

    const {setHighlightIds} = useHighlight()
    const session = useContext(SessionContext)

    const debouncedQuery = useDebouncedValue(query)

    useEffect(() => {
        const urlQ = searchParams.get('q') ?? ''

        if (lastUrlQRef.current === urlQ) return

        lastUrlQRef.current = urlQ

        setQuery(urlQ)
    }, [searchParams])

    const clearFocusParam = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (!params.has('focus')) return

        params.delete('focus')
        const qs = params.toString()
        const url = qs ? `${pathname}?${qs}` : pathname

        router.replace(url)
        setHighlightIds([])
    }, [searchParams, pathname, router, setHighlightIds])

    // Focus highlight from URL
    useEffect(() => {
        const focusId = searchParams.get('focus')
        if (focusId) {
            setHighlightIds([focusId])
        }
    }, [searchParams, setHighlightIds])

    // Clear highlights on leaving page
    useEffect(() => {
        return () => {
            setHighlightIds([])
        }
    }, [setHighlightIds])

    const extractPlaceIds = (hits: SearchHit[]): string[] =>
        Array.from(
            new Set(
                hits
                    .map(h => h.placeId || (h.type === 'PLACE' ? h.id : null))
                    .filter((id): id is string => Boolean(id)),
            ),
        )

    const matchHrefForHit = (hit: SearchHit): string => {
        switch (hit.type) {
            case 'PLACE':
                return `/places/${hit.id}`
            case 'EVENT':
                return `/events/${hit.id}`
            case 'PERFORMER':
                return `/performers/${hit.id}`
            default:
                return '/'
        }
    }

    // Outside click
    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current) return
            if (!rootRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('pointerdown', onPointerDown, {capture: true})
        return () =>
            document.removeEventListener('pointerdown', onPointerDown as any, {
                capture: true,
            } as any)
    }, [])

    // Escape closes dropdown
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [])

    // Debounced search driven by debouncedQuery
    useEffect(() => {
        const q = debouncedQuery.trim()

        if (!q) {
            setItems([])
            setOpen(false)
            if (!hasFocusParam) {
                setHighlightIds([])
            }
            return
        }

        let cancelled = false

        ;(async () => {
            try {
                const hits = await fetchSearch(q, session)
                if (cancelled) return

                setItems(hits)

                const placeIds = extractPlaceIds(hits)
                if (!hasFocusParam) {
                    setHighlightIds(placeIds)
                    setOpen(true)
                } else {
                    setOpen(false)
                }


            } catch (e) {
                if (cancelled) return

                console.error('Search failed', e)
                setItems([])
                setOpen(false)
                if (!hasFocusParam) {
                    setHighlightIds([])
                }
            }
        })()

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery, hasFocusParam, setHighlightIds])

    const clearAll = () => {
        setQuery('')
        setItems([])
        setOpen(false)
        setHighlightIds([])
        router.replace(pathname)
    }

    const dismissResults = () => {
        setOpen(false)
        requestAnimationFrame(() => inputRef.current?.blur())
    }

    const handlePrimaryClick = (hit: SearchHit) => {
        const placeIdForFocus =
            hit.placeId || (hit.type === 'PLACE' ? hit.id : undefined)

        if (placeIdForFocus) {
            if (pathname !== '/') {
                const params = new URLSearchParams()
                params.set('focus', placeIdForFocus)
                const q = query.trim()
                if (q) params.set('q', q)

                router.push('/?' + params.toString())
            } else {
                setHighlightIds([placeIdForFocus])
            }
        } else {
            router.push(matchHrefForHit(hit))
        }
        dismissResults()
    }

    const handleViewClick = (hit: SearchHit) => {
        router.push(matchHrefForHit(hit))
        dismissResults()
    }

    const handleEnter = () => {
        const q = query.trim()
        if (!q) {
            clearAll()
            return
        }

        clearFocusParam()

        const placeIds = extractPlaceIds(items)
        if (!placeIds.length) {
            dismissResults()
            return
        }

        setHighlightIds(placeIds)
        const params = new URLSearchParams()
        params.set('q', q)
        router.push('/?' + params.toString())

        dismissResults()
    }

    return (
        <div ref={rootRef} className="relative">
            {/* Input */}
            <div
                className="flex items-center gap-2 rounded-full border border-white/20 dark:border-zinc/50 bg-white/90
                          dark:bg-zinc-900/70 px-3 py-2 shadow-sm dark:shadow-md backdrop-blur-md transition focus-within:ring-2
                          focus-within:ring-violet-400/60 dark:focus-within:ring-violet-500/50"
            >
                <button
                    type="button"
                    onClick={query.trim() ? handleEnter : undefined}
                    aria-label="Search"
                    disabled={!query.trim()}
                    className={`p-0 m-0 bg-transparent border-0 inline-flex items-center justify-center h-4 w-4 
            ${
                        query.trim()
                            ? 'cursor-pointer text-zinc-700 dark:text-zinc-300'
                            : 'cursor-default opacity-40 text-zinc-500 dark:text-zinc-600'
                    }`}
                >
                    <Search className="h-4 w-4" aria-hidden/>
                </button>

                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value)
                        if (hasFocusParam) {
                            clearFocusParam()
                        }
                    }}
                    onFocus={() => {
                        if (items.length) setOpen(true)
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            handleEnter()
                        }
                    }}
                    placeholder="Search places, events, performers, tags"
                    className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600
                            dark:placeholder-zinc-400 outline-none"
                />

                {query.trim() && (
                    <button
                        type="button"
                        onClick={open ? dismissResults : undefined}
                        aria-label={open ? 'Hide results' : 'Results hidden'}
                        aria-disabled={!open}
                        className={`flex-shrink-0 inline-flex items-center justify-center rounded-full h-7 w-7 transition-colors 
                                    focus:outline-none focus-visible:ring-2 cursor-pointer 
                        ${
                            open
                                ? 'text-white bg-violet-600/80 hover:bg-violet-600 focus-visible:ring-violet-400/60'
                                : 'text-zinc-500 dark:text-zinc-500 opacity-60 pointer-events-none'
                        }`}
                    >
                        <Minimize2 className="h-4 w-4"/>
                    </button>
                )}

                <button
                    type="button"
                    onClick={clearAll}
                    aria-label="Clear selection"
                    className="flex-shrink-0 inline-flex items-center justify-center rounded-full h-7 w-7 text-zinc-700
                            dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2
                            focus-visible:ring-violet-500/60 cursor-pointer"
                >
                    <Eraser className="h-4 w-4"/>
                </button>
            </div>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute left-0 top-full mt-2 w-full max-h-96 overflow-auto rounded-xl border border-violet-300/50
                               dark:border-violet-400/20 bg-white/85 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-lg z-[2000]"
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
                                    onViewClick={() => handleViewClick(hit)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
