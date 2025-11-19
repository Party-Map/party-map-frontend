import {useEffect, useRef, useState} from 'react'
import {useMap} from 'react-leaflet'
import L from 'leaflet'
import type {Place} from '@/lib/types'

export function DesktopZoomControls({
                                        openPopupId,
                                        places,
                                    }: {
    openPopupId: string | null
    places: Place[]
}) {
    const map = useMap()
    const [tip, setTip] = useState<{ key: string; visible: boolean }>({
        key: '',
        visible: false,
    })
    const timers = useRef<Record<string, number>>({})

    const startTip = (key: string) => {
        clearTip(key)
        timers.current[key] = window.setTimeout(() => {
            setTip({key, visible: true})
        }, 2000)
    }

    const clearTip = (key?: string) => {
        if (key) {
            const id = timers.current[key]
            if (id) window.clearTimeout(id)
            delete timers.current[key]
        } else {
            Object.values(timers.current).forEach(id => window.clearTimeout(id))
            timers.current = {}
        }
        setTip(prev => (prev.key === key ? {key: '', visible: false} : prev))
    }

    useEffect(() => () => clearTip(), [])

    function preciseZoom(kind: 'in' | 'out') {
        try {
            const preCenter = map.getCenter()
            const size = map.getSize()
            const viewCenterPt = L.point(size.x / 2, size.y / 2)
            map.once('zoomend', () => {
                try {
                    const postPt = map.latLngToContainerPoint(preCenter)
                    const dx = postPt.x - viewCenterPt.x
                    const dy = postPt.y - viewCenterPt.y
                    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                        map.panBy([-dx, -dy], {animate: false})
                    }
                } catch {
                }
            })
            kind === 'in' ? map.zoomIn() : map.zoomOut()
        } catch {
        }
    }

    const containerRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        try {
            L.DomEvent.disableClickPropagation(el)
            L.DomEvent.disableScrollPropagation(el)
        } catch {
        }
    }, [])

    const selectedPlace = openPopupId ? places.find(p => p.id === openPopupId) : null

    const recenter = () => {
        if (!selectedPlace) return
        try {
            const currentZoom = map.getZoom()
            map.flyTo(
                [selectedPlace.location.lat, selectedPlace.location.lng],
                currentZoom,
                {duration: 0.6},
            )
        } catch {
        }
    }

    return (
        <div
            ref={containerRef}
            className="hidden md:flex absolute right-4 top-24 z-[1000] select-none pm-zoom-controls flex-col gap-3"
        >
            <div
                className="flex flex-col overflow-visible rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/50 border border-black/10 dark:border-white/10 shadow-lg divide-y divide-black/10 dark:divide-white/10">
                <div className="relative">
                    <button
                        aria-label="Zoom in"
                        className="h-11 w-11 grid place-items-center text-slate-800 dark:text-slate-100 rounded-md hover:bg-white/90 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 active:scale-95"
                        onPointerDown={e => {
                            e.stopPropagation()
                            try { map.dragging.disable() } catch {}
                        }}
                        onPointerUp={e => {
                            e.stopPropagation()
                            try { map.dragging.enable() } catch {}
                        }}
                        onPointerLeave={() => {
                            try { map.dragging.enable() } catch {}
                        }}
                        onPointerCancel={() => {
                            try { map.dragging.enable() } catch {}
                        }}
                        onMouseEnter={() => startTip('zin')}
                        onMouseLeave={() => clearTip('zin')}
                        onClick={e => {
                            e.stopPropagation()
                            ;(window as any).__pmLastZoomClick = Date.now()
                            preciseZoom('in')
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                    </button>
                    {tip.visible && tip.key === 'zin' && (
                        <span
                            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded bg-slate-900/90 text-white shadow-lg ring-1 ring-white/10">
              Zoom in
            </span>
                    )}
                </div>
                <div className="relative">
                    <button
                        aria-label="Zoom out"
                        className="h-11 w-11 grid place-items-center text-slate-800 dark:text-slate-100 rounded-md hover:bg-white/90 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 active:scale-95"
                        onPointerDown={e => {
                            e.stopPropagation()
                            try { map.dragging.disable() } catch {}
                        }}
                        onPointerUp={e => {
                            e.stopPropagation()
                            try { map.dragging.enable() } catch {}
                        }}
                        onPointerLeave={() => {
                            try { map.dragging.enable() } catch {}
                        }}
                        onPointerCancel={() => {
                            try { map.dragging.enable() } catch {}
                        }}
                        onMouseEnter={() => startTip('zout')}
                        onMouseLeave={() => clearTip('zout')}
                        onClick={e => {
                            e.stopPropagation()
                            ;(window as any).__pmLastZoomClick = Date.now()
                            preciseZoom('out')
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12h14"/>
                        </svg>
                    </button>
                    {tip.visible && tip.key === 'zout' && (
                        <span
                            className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded bg-slate-900/90 text-white shadow-lg ring-1 ring-white/10">
              Zoom out
            </span>
                    )}
                </div>
            </div>
            {selectedPlace && (
                <div className="relative">
                    <button
                        onClick={e => {
                            e.stopPropagation()
                            recenter()
                        }}
                        aria-label="Center selected"
                        className="h-11 w-11 grid place-items-center rounded-md backdrop-blur-xl bg-white/70 dark:bg-slate-900/50 border border-black/10 dark:border-white/10 shadow-lg text-pink-600 dark:text-pink-300 hover:bg-white/90 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 active:scale-95"
                        onMouseEnter={() => startTip('center')}
                        onMouseLeave={() => clearTip('center')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 2v3"/>
                            <path d="M12 19v3"/>
                            <path d="M22 12h-3"/>
                            <path d="M5 12H2"/>
                            <path d="M19.07 4.93l-2.12 2.12"/>
                            <path d="M6.34 17.66l-2.12 2.12"/>
                            <path d="M6.34 6.34L4.22 4.22"/>
                            <path d="M19.07 19.07l-2.12-2.12"/>
                        </svg>
                    </button>
                    {tip.visible && tip.key === 'center' && (
                        <span
                            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded bg-slate-900/90 text-white shadow-lg ring-1 ring-white/10">
              Center selected
            </span>
                    )}
                </div>
            )}
        </div>
    )
}
