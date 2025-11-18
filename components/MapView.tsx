'use client'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import L, { LatLngTuple } from 'leaflet'
import { useEffect, useState, useRef } from 'react'
import type { Place, Event, EventType } from '@/lib/types'
import type { LatLng } from '@/lib/map/types'
import { EVENT_TYPE_LABELS } from '@/lib/types'
// EVENT_TYPE_BADGE_CLASSES replaced by CSS-based .event-badge styles
import PlacePopupCard from './PlacePopupCard'

// Zoom thresholds for when floating labels become visible
const BASE_LABEL_ZOOM = 13 // was 12, +1 per refactor request
const HIGHLIGHT_LABEL_ZOOM = 11 // was 10, +1 per refactor request
// Vertical offsets for label positioning (higher negative = higher above pin)
const LABEL_BASE_OFFSET = -76 // was -72; raised slightly per request
const LABEL_HIGHLIGHT_OFFSET = -84 // was -80; keep relative spacing

// Fancy pin (CSS driven). Shiny state adds glow + sparkles.
function fancyPinIcon(color: string, shiny: boolean) {
  return L.divIcon({
    className: 'pm-pin-wrapper',
    html: `\n      <div class="pm-pin ${shiny ? 'pm-shiny' : ''}" style="--pin:${color}">\n        <div class='pm-pin-head'>\n          <div class='pm-pin-core'></div>\n          <div class='pm-pin-gloss'></div>\n          <div class='pm-pin-sparkles'>\n            <span class='sp s1'></span>\n            <span class='sp s2'></span>\n            <span class='sp s3'></span>\n          </div>\n        </div>\n        <div class='pm-pin-tail'></div>\n      </div>`,
    iconSize: [36, 48],
    iconAnchor: [18, 44],
    popupAnchor: [0, -38],
  })
}

interface Props { places: Place[]; events: Event[]; isDark?: boolean; highlightIds?: string[]; activePlaceId?: string | null; activePlaceIds?: string[] }

// Floating labels above pins showing event name, place, and type tag
function PlaceLabels({
  places,
  eventsByPlace,
  highlightIds,
  openPopupId,
  onOpen,
}: {
  places: Place[]
  eventsByPlace: Map<string, Event[]>
  highlightIds?: string[]
  openPopupId: string | null
  onOpen: (id: string) => void
}) {
  const map = useMap()
  const [, force] = useState(0)
  const frameRef = useRef<number | null>(null)
  const interactingRef = useRef(false)
  const [isInteracting, setIsInteracting] = useState(false)

  useEffect(() => {
    const schedule = () => {
      if (frameRef.current != null) return
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        force(c => c + 1)
      })
    }
    const onStart = () => {
      if (!interactingRef.current) {
        interactingRef.current = true
        setIsInteracting(true)
      }
      schedule()
    }
    const onMove = schedule
    const onEnd = () => {
      schedule()
      // Allow one more frame to land, then release interaction state (gives instant follow during gesture)
      requestAnimationFrame(() => {
        interactingRef.current = false
        // Small timeout avoids flicker between rapid consecutive wheel events
        setTimeout(() => { if (!interactingRef.current) setIsInteracting(false) }, 80)
      })
    }
    map.on('movestart', onStart)
    map.on('zoomstart', onStart)
    map.on('move', onMove)
    map.on('zoom', onMove)
    map.on('moveend', onEnd)
    map.on('zoomend', onEnd)
    return () => {
      map.off('movestart', onStart)
      map.off('zoomstart', onStart)
      map.off('move', onMove)
      map.off('zoom', onMove)
      map.off('moveend', onEnd)
      map.off('zoomend', onEnd)
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
  }, [map])

  const size = map.getSize()
  const centerPt = size.divideBy(2)
  const maxDist = Math.min(size.x, size.y) * 0.9
  const zoom = map.getZoom()
  const baseMinLabelZoom = BASE_LABEL_ZOOM
  const highlightMinLabelZoom = HIGHLIGHT_LABEL_ZOOM // allow labels earlier when there is a selection/highlight
  const hasHighlights = !!(highlightIds && highlightIds.length)
  const minLabelZoom = hasHighlights ? highlightMinLabelZoom : baseMinLabelZoom

  // Using centralized event type style mapping from lib/types

  const now = Date.now()

  // Precompute popup occlusion rectangle (approximate) to hide labels behind popup
  let popupRect: { left: number; right: number; top: number; bottom: number } | null = null
  if (openPopupId) {
    const anchorPlace = places.find(pl => pl.id === openPopupId)
    if (anchorPlace) {
      const ppt = map.latLngToContainerPoint([anchorPlace.location.lat, anchorPlace.location.lng])
      // Approximate popup size: wider than pin, mostly above anchor. Tune as needed.
      const halfW = 140
      const heightAbove = 230 // area above anchor covered by popup
      const heightBelow = 10
      popupRect = {
        left: ppt.x - halfW,
        right: ppt.x + halfW,
        top: ppt.y - heightAbove,
        bottom: ppt.y + heightBelow,
      }
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-[600] select-none">
  {zoom < minLabelZoom ? null : places.map(p => {
        const pt = map.latLngToContainerPoint([p.location.lat, p.location.lng])
        if (pt.x < -80 || pt.y < -80 || pt.x > size.x + 80 || pt.y > size.y + 80) return null

        const isHighlighted = !!highlightIds?.includes(p.id)
        const isActive = openPopupId === p.id
        // Hide labels that would appear visually inside the open popup (except the active one which we already fade/transform)
        if (!isActive && popupRect) {
          if (pt.x >= popupRect.left && pt.x <= popupRect.right && pt.y >= popupRect.top && pt.y <= popupRect.bottom) {
            return null
          }
        }
        const evts = eventsByPlace.get(p.id) || []
        const upcoming = evts
          .slice()
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
          .find(e => new Date(e.end).getTime() >= now) || evts[0]
        if (!upcoming) return null
        let opacity = 1
        if (!isHighlighted && !isActive) {
          if (openPopupId || hasHighlights) {
            // When a selection or search result context exists, make other labels barely visible
            opacity = 0.06
          } else {
            const dist = centerPt.distanceTo(pt)
            opacity = 1 - dist / maxDist
            opacity = Math.max(0.15, Math.min(1, opacity))
          }
        }
  // style provided via CSS .event-badge[data-kind]
        const baseOffset = -72
  const offsetY = (isHighlighted || isActive) ? LABEL_HIGHLIGHT_OFFSET : LABEL_BASE_OFFSET
        const finalOpacity = isActive ? 0 : opacity
        const transform = isActive
          ? `translate(-50%, ${offsetY - 34}px) scale(.6)` // animate upward + shrink as popup appears
          : `translate(-50%, ${offsetY}px)`
        return (
          <div
            key={`lbl-${p.id}`}
            style={{
              position: 'absolute',
              left: pt.x,
              top: pt.y,
              transform,
              opacity: finalOpacity,
              transition: isInteracting
                ? 'opacity 160ms ease' // disable transform easing while interacting for snappy follow
                : 'opacity 220ms ease, transform 260ms cubic-bezier(.4,.2,.2,1)',
              pointerEvents: isActive ? 'none' : 'auto',
            }}
            className="will-change-transform"
            aria-hidden={isActive}
          >
            <button
              type="button"
              onClick={() => onOpen(p.id)}
              className="pointer-events-auto focus:outline-none group text-center"
              aria-label={`Open ${upcoming.title}`}
              disabled={isActive}
            >
              <span className="block mx-auto text-[11px] font-semibold leading-tight whitespace-nowrap text-slate-800 dark:text-slate-100 drop-shadow-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] group-hover:text-pink-600 dark:group-hover:text-pink-300">
                {upcoming.title}
              </span>
              <div className="mt-0.5 flex items-center gap-1 justify-center">
                <span className="text-[9px] uppercase tracking-wide font-medium text-slate-600 dark:text-slate-400 [text-shadow:0_1px_1px_rgba(0,0,0,0.4)]">
                  {p.name}
                </span>
                <span data-kind={upcoming.kind} className="event-badge text-[9px] leading-none font-semibold px-1 py-0.5 rounded shadow [text-shadow:0_1px_1px_rgba(0,0,0,0.35)]">{EVENT_TYPE_LABELS[upcoming.kind] || upcoming.kind}</span>
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}

function FitToHighlights({ places, highlightIds }: { places: Place[]; highlightIds?: string[] }) {
  const map = useMap()
  useEffect(() => {
    if (!highlightIds || highlightIds.length === 0) return
    const targets = places.filter(p => highlightIds.includes(p.id))
    if (targets.length === 0) return
    if (targets.length === 1) {
      const t = targets[0]
      map.flyTo([t.location.lat, t.location.lng], 15, { duration: 0.6 })
      return
    }
    const bounds = L.latLngBounds(targets.map(t => [t.location.lat, t.location.lng]) as LatLngTuple[])
    map.flyToBounds(bounds.pad(0.2), { duration: 0.8 })
  }, [highlightIds, places, map])
  return null
}

// When a popup opens on mobile, pan the map so the pin sits near the bottom center
function PanPopupMobile({ places, openPopupId }: { places: Place[]; openPopupId: string | null }) {
  const map = useMap()
  useEffect(() => {
    if (!openPopupId) return
    if (typeof window === 'undefined' || window.innerWidth >= 768) return
    const place = places.find(p => p.id === openPopupId)
    if (!place) return
    let frame: number | null = null
    frame = requestAnimationFrame(() => {
      try {
        const latlng: LatLngTuple = [place.location.lat, place.location.lng]
        const currentPt = map.latLngToContainerPoint(latlng)
        const size = map.getSize()
        const bottomBar = 64 + 16 + (Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0)
        const pinHeight = 48
        const margin = 12
        const desiredPt = L.point(size.x / 2, size.y - (bottomBar + pinHeight + margin))
        const offset = currentPt.subtract(desiredPt)
        if (Math.abs(offset.x) + Math.abs(offset.y) < 6) return
        // Use shorter duration to reduce perceived flicker; rely on CSS transitions inside popup
        map.panBy(offset, { animate: true, duration: 0.35 })
      } catch {}
    })
    return () => { if (frame) cancelAnimationFrame(frame) }
  }, [openPopupId, places, map])
  // Re-run on orientation / resize to keep visible if dimensions change
  useEffect(() => {
    const handler = () => {
      if (!openPopupId) return
      // trigger effect by cloning id ref (force update via state not needed: rely on dependency change via timeouts)
      setTimeout(() => {
        // Recalculate by updating state indirectly: simply calling map.fire will not re-run; we can force by panning 0 (noop)
        try { map.panBy([0,0], { animate: false }) } catch {}
      }, 50)
    }
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler as any)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler as any)
    }
  }, [openPopupId, map])
  return null
}

// Ask for browser geolocation, center map, and show a pulsing marker when permitted
function UserLocation({ auto = true }: { auto?: boolean }) {
  const map = useMap()
  const [pos, setPos] = useState<LatLngTuple | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)

  useEffect(() => {
    if (!auto || typeof window === 'undefined' || !('geolocation' in navigator)) return
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }

    navigator.geolocation.getCurrentPosition(
      (g) => {
        const p: LatLngTuple = [g.coords.latitude, g.coords.longitude]
        setPos(p)
        setAccuracy(g.coords.accuracy ?? null)
        try { window.dispatchEvent(new CustomEvent('pm:user-position', { detail: { lat: p[0], lng: p[1] } })) } catch {}
        try { map.flyTo(p, Math.max(map.getZoom(), 14), { duration: 0.8 }) } catch {}
      },
      () => { /* ignore denied/unavailable */ },
      opts
    )

    const id = navigator.geolocation.watchPosition(
      (g) => {
        const p: LatLngTuple = [g.coords.latitude, g.coords.longitude]
        setPos(p)
        setAccuracy(g.coords.accuracy ?? null)
        try { window.dispatchEvent(new CustomEvent('pm:user-position', { detail: { lat: p[0], lng: p[1] } })) } catch {}
      },
      () => {},
      opts
    )

    return () => {
      try { navigator.geolocation.clearWatch?.(id as any) } catch {}
    }
  }, [map, auto])

  if (!pos) return null

  const youIcon = L.divIcon({
    className: 'pm-you-wrapper',
    html: "<div class='pm-you'><span class='glow'></span><span class='ring'></span><span class='core'></span><span class='wave w1'></span><span class='wave w2'></span></div>",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

  return (
    <>
      {accuracy && (
        <Circle
          center={pos as any}
          radius={Math.min(accuracy, 200)}
          pathOptions={{ color: '#60a5fa', weight: 1, opacity: 0.8, fillColor: '#60a5fa', fillOpacity: 0.12 }}
        />
      )}
      <Marker position={pos} icon={youIcon as any} />
    </>
  )
}

// Desktop-only custom zoom controls (glassmorphism)
function DesktopZoomControls({ openPopupId, places }: { openPopupId: string | null; places: Place[] }) {
  const map = useMap()
  const [tip, setTip] = useState<{ key: string; visible: boolean }>({ key: '', visible: false })
  const timers = useRef<Record<string, number>>({})
  const startTip = (key: string) => {
    clearTip(key)
    timers.current[key] = window.setTimeout(() => {
      setTip({ key, visible: true })
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
    setTip(prev => prev.key === key ? { key: '', visible: false } : prev)
  }
  useEffect(() => () => { clearTip() }, [])
  const stopAll = (e: React.SyntheticEvent) => { e.stopPropagation(); }
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
            // Counter-pan to keep visual center stable (no animation to avoid wobble)
            map.panBy([-dx, -dy], { animate: false })
          }
        } catch {}
      })
      kind === 'in' ? map.zoomIn() : map.zoomOut()
    } catch {}
  }
  const containerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      L.DomEvent.disableClickPropagation(el)
      L.DomEvent.disableScrollPropagation(el)
    } catch {}
  }, [])
  const selectedPlace = openPopupId ? places.find(p => p.id === openPopupId) : null
  const recenter = () => {
    if (!selectedPlace) return
    try {
      const currentZoom = map.getZoom()
      map.flyTo([selectedPlace.location.lat, selectedPlace.location.lng], currentZoom, { duration: 0.6 })
    } catch {}
  }
  return (
    <div ref={containerRef} className="hidden md:flex absolute right-4 top-24 z-[1000] select-none pm-zoom-controls flex-col gap-3">
  <div className="flex flex-col overflow-visible rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/50 border border-black/10 dark:border-white/10 shadow-lg divide-y divide-black/10 dark:divide-white/10">
        <div className="relative">
        <button
          aria-label="Zoom in"
          className="h-11 w-11 grid place-items-center text-slate-800 dark:text-slate-100 rounded-md hover:bg-white/90 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 active:scale-95"
          onPointerDown={(e) => { e.stopPropagation(); try { map.dragging.disable() } catch {}; }}
          onPointerUp={(e) => { e.stopPropagation(); try { map.dragging.enable() } catch {}; }}
          onPointerLeave={() => { try { map.dragging.enable() } catch {}; }}
          onPointerCancel={() => { try { map.dragging.enable() } catch {}; }}
          onMouseEnter={() => startTip('zin')}
          onMouseLeave={() => clearTip('zin')}
          onClick={(e) => { e.stopPropagation(); (window as any).__pmLastZoomClick = Date.now(); preciseZoom('in') }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        {tip.visible && tip.key === 'zin' && (
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded bg-slate-900/90 text-white shadow-lg ring-1 ring-white/10">Zoom in</span>
        )}
        </div>
        <div className="relative">
        <button
          aria-label="Zoom out"
          className="h-11 w-11 grid place-items-center text-slate-800 dark:text-slate-100 rounded-md hover:bg-white/90 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 active:scale-95"
          onPointerDown={(e) => { e.stopPropagation(); try { map.dragging.disable() } catch {}; }}
          onPointerUp={(e) => { e.stopPropagation(); try { map.dragging.enable() } catch {}; }}
          onPointerLeave={() => { try { map.dragging.enable() } catch {}; }}
          onPointerCancel={() => { try { map.dragging.enable() } catch {}; }}
          onMouseEnter={() => startTip('zout')}
          onMouseLeave={() => clearTip('zout')}
          onClick={(e) => { e.stopPropagation(); (window as any).__pmLastZoomClick = Date.now(); preciseZoom('out') }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14"/>
          </svg>
        </button>
        {tip.visible && tip.key === 'zout' && (
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded bg-slate-900/90 text-white shadow-lg ring-1 ring-white/10">Zoom out</span>
        )}
        </div>
      </div>
      {selectedPlace && (
        <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); recenter(); }}
          aria-label="Center selected"
          className="h-11 w-11 grid place-items-center rounded-md backdrop-blur-xl bg-white/70 dark:bg-slate-900/50 border border-black/10 dark:border-white/10 shadow-lg text-pink-600 dark:text-pink-300 hover:bg-white/90 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 active:scale-95"
          onMouseEnter={() => startTip('center')}
          onMouseLeave={() => clearTip('center')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3" />
            <path d="M12 19v3" />
            <path d="M22 12h-3" />
            <path d="M5 12H2" />
            <path d="M19.07 4.93l-2.12 2.12" />
            <path d="M6.34 17.66l-2.12 2.12" />
            <path d="M6.34 6.34L4.22 4.22" />
            <path d="M19.07 19.07l-2.12-2.12" />
          </svg>
        </button>
        {tip.visible && tip.key === 'center' && (
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded bg-slate-900/90 text-white shadow-lg ring-1 ring-white/10">Center selected</span>
        )}
        </div>
      )}
    </div>
  )
}

// Close popup on map background clicks only
function MapBackgroundCloser({ onClose }: { onClose: () => void }) {
  const map = useMap()
  useEffect(() => {
    const handler = (e: any) => {
      const t = e.originalEvent?.target as HTMLElement | null
      if (!t) return
      // Ignore clicks originating inside zoom controls or popup
      if (t.closest('.pm-zoom-controls')) return
      if (t.closest('.leaflet-popup')) return
  // Ignore immediately after a zoom control click to avoid race with synthetic map click
  const last = (window as any).__pmLastZoomClick as number | undefined
  if (last && Date.now() - last < 250) return
      onClose()
    }
    map.on('click', handler)
    return () => { map.off('click', handler) }
  }, [map, onClose])
  return null
}

export default function MapView({ places, events, isDark = false, highlightIds, activePlaceId, activePlaceIds }: Props) {
  // Single-popup state
  const [openPopupId, setOpenPopupId] = useState<string | null>(null)
  const eventsByPlace = new Map<string, Event[]>()
  for (const e of events) {
    eventsByPlace.set(e.placeId, [...(eventsByPlace.get(e.placeId) || []), e])
  }
  const center: LatLngTuple = [47.4979, 19.0402]
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const attribution = isDark ? '&copy; OSM · © CARTO' : '&copy; OpenStreetMap'

  // Sync incoming controls from parent (prefer single id)
  useEffect(() => {
    if (activePlaceId) {
      setOpenPopupId(activePlaceId)
      return
    }
    if (activePlaceIds && activePlaceIds.length) {
      setOpenPopupId(activePlaceIds[0])
      return
    }
    // If both are cleared
    if (!activePlaceIds && !activePlaceId) setOpenPopupId(null)
  }, [activePlaceId, activePlaceIds])

  // Close all popups on global pm:close-popups (e.g., Clear button)
  useEffect(() => {
    const onCloseAll = () => setOpenPopupId(null)
    window.addEventListener('pm:close-popups', onCloseAll as any)
    return () => window.removeEventListener('pm:close-popups', onCloseAll as any)
  }, [])

  return (
    <div className="h-full w-full relative z-0">
      {/* center + other props typed via module augmentation */}
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer attribution={attribution} url={tileUrl} />
  <FitToHighlights places={places} highlightIds={highlightIds} />
        {/* Geolocate user and center map if allowed */}
        <UserLocation />
        {/* Custom desktop zoom controls */}
  <DesktopZoomControls openPopupId={openPopupId} places={places} />
  {/* Floating labels */}
  <PlaceLabels places={places} eventsByPlace={eventsByPlace} highlightIds={highlightIds} openPopupId={openPopupId} onOpen={(id) => setOpenPopupId(prev => prev === id ? null : id)} />
        {places.map((p) => {
          const isHighlighted = !!highlightIds?.includes(p.id)
          const isActive = openPopupId === p.id
          const shiny = isHighlighted || isActive
          const baseColor = isActive ? '#ec4899' : (isHighlighted ? '#8b5cf6' : (isDark ? '#475569' : '#334155'))
          const icon = fancyPinIcon(baseColor, shiny)
          const pos: LatLngTuple = [p.location.lat, p.location.lng]
          return (
            <Marker
              key={p.id}
              position={pos}
              icon={icon as any}
              eventHandlers={{
                click: () => setOpenPopupId(prev => prev === p.id ? null : p.id)
              }}
            />
          )
        })}
        {/* Render only one popup at a time */}
        {(() => {
          const p = openPopupId ? places.find(x => x.id === openPopupId) : undefined
          if (!p) return null
          return (
            <Popup
              key={`popup-${p.id}`}
              position={[p.location.lat, p.location.lng] as LatLngTuple}
      // We handle panning manually for mobile to keep pin near bottom
      autoPan={false}
              closeButton={false}
              closeOnClick={false}
              autoClose={false}
              // Raise popup higher above pin to avoid visual collision
              offset={[0, -48]}
              className="place-popup"
              eventHandlers={{ remove: () => setOpenPopupId(prev => (prev === p.id ? null : prev)) }}
            >
              <PlacePopupCard place={p} onClose={() => setOpenPopupId(prev => (prev === p.id ? null : prev))} />
            </Popup>
          )
        })()}
    {/* Mobile pan adjustment component */}
  <PanPopupMobile places={places} openPopupId={openPopupId} />
  <MapBackgroundCloser onClose={() => setOpenPopupId(null)} />
      </MapContainer>
      {/* styles moved to app/map.css */}
    </div>
  )
}
