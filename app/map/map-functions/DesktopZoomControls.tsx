import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
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

    const [anchorActive, setAnchorActive] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const selectedPlace = useMemo(
        () => (openPopupId ? places.find(p => p.id === openPopupId) ?? null : null),
        [openPopupId, places],
    )

    // Stop map interaction leaking through the controls
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        try {
            L.DomEvent.disableClickPropagation(el)
            L.DomEvent.disableScrollPropagation(el)
        } catch {
            // ignore
        }
    }, [])

    // Lose anchor on user drag
    useEffect(() => {
        const handleDragStart = () => {
            setAnchorActive(false)
        }

        map.on('dragstart', handleDragStart)
        return () => {
            map.off('dragstart', handleDragStart)
        }
    }, [map])

    // Zoom anchored to selected place when anchorActive = true
    const zoom = useCallback(
        (kind: 'in' | 'out') => {
            try {
                const delta = kind === 'in' ? 1 : -1
                const currentZoom = map.getZoom()
                const targetZoom = currentZoom + delta

                if (anchorActive && selectedPlace) {
                    const anchor = L.latLng(
                        selectedPlace.location.latitude,
                        selectedPlace.location.longitude,
                    )
                    map.setZoomAround(anchor, targetZoom)
                } else {
                    map.setZoom(targetZoom)
                }
            } catch {
            }
        },
        [map, selectedPlace, anchorActive],
    )

    // Centers to the selected pin (with vertical offset) and activates anchor
    const recenter = useCallback(() => {
        if (!selectedPlace) return

        try {
            const zoomLevel = map.getZoom()
            const point = map.project(
                [selectedPlace.location.latitude, selectedPlace.location.longitude],
                zoomLevel,
            )

            // positive y moves the map center down (marker appears higher)
            const offsetY = -100
            const adjustedPoint = point.add([0, offsetY])
            const adjustedLatLng = map.unproject(adjustedPoint, zoomLevel)

            setAnchorActive(true)
            map.flyTo(adjustedLatLng, zoomLevel, {duration: 0.6})
        } catch {
        }
    }, [map, selectedPlace])

    // Shared pointer handlers to avoid repeating try/catch
    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.stopPropagation()
            try {
                map.dragging.disable()
            } catch {
            }
        },
        [map],
    )

    const handlePointerUpOrLeave = useCallback(() => {
        try {
            map.dragging.enable()
        } catch {
        }
    }, [map])

    return (
        <div
            ref={containerRef}
            className="hidden md:flex absolute right-4 top-24 z-[1000] select-none pm-zoom-controls flex-col gap-3"
        >
            <div
                className="flex flex-col overflow-visible rounded-2xl backdrop-blur-xl bg-white/70
        dark:bg-slate-900/50 border border-black/10 dark:border-white/10 shadow-lg divide-y
        divide-black/10 dark:divide-white/10"
            >
                {/* Zoom in */}
                <div className="relative group">
                    <button
                        aria-label="Zoom in"
                        className="h-11 w-11 grid place-items-center text-slate-800 dark:text-slate-100
            rounded-md hover:bg-white/90
            dark:hover:bg-slate-800/60 transition-colors
            focus:outline-none focus-visible:ring-2
            focus-visible:ring-pink-500/60 active:scale-95 cursor-pointer"
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUpOrLeave}
                        onPointerLeave={handlePointerUpOrLeave}
                        onPointerCancel={handlePointerUpOrLeave}
                        onClick={e => {
                            e.stopPropagation()
                            ;(window as any).__pmLastZoomClick = Date.now()
                            zoom('in')
                        }}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                    </button>
                    <span
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1
            whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded bg-slate-900/90 text-white shadow-lg
            ring-1 ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
            Zoom in
          </span>
                </div>

                {/* Zoom out */}
                <div className="relative group">
                    <button
                        aria-label="Zoom out"
                        className="h-11 w-11 grid place-items-center text-slate-800 dark:text-slate-100 rounded-md
            hover:bg-white/90 dark:hover:bg-slate-800/60 transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 active:scale-95 cursor-pointer"
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUpOrLeave}
                        onPointerLeave={handlePointerUpOrLeave}
                        onPointerCancel={handlePointerUpOrLeave}
                        onClick={e => {
                            e.stopPropagation()
                            ;(window as any).__pmLastZoomClick = Date.now()
                            zoom('out')
                        }}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M5 12h14"/>
                        </svg>
                    </button>
                    <span
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1
            whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded bg-slate-900/90
            text-white shadow-lg ring-1 ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
            Zoom out
          </span>
                </div>
            </div>

            {/* Center selected */}
            {selectedPlace && (
                <div className="relative group">
                    <button
                        onClick={e => {
                            e.stopPropagation()
                            recenter()
                        }}
                        aria-label="Center selected"
                        className={`
              h-11 w-11 grid place-items-center rounded-md backdrop-blur-xl
              bg-white/70 dark:bg-slate-900/50
              border shadow-lg text-pink-600 dark:text-pink-300
              hover:bg-white/90 dark:hover:bg-slate-800/60
              transition-colors focus:outline-none focus-visible:ring-2
              focus-visible:ring-pink-500/60 active:scale-95 cursor-pointer
              ${
                            anchorActive
                                ? 'border-pink-500 dark:border-pink-300'
                                : 'border-black/10 dark:border-white/10'
                        }
            `}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
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
                    <span
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1
            whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded
            bg-slate-900/90 text-white shadow-lg ring-1
            ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
            Center selected
          </span>
                </div>
            )}
        </div>
    )
}
