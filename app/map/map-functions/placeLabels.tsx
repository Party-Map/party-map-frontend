import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { Event, Place } from '@/lib/types'
import { EVENT_TYPE_BADGE_CLASSES, EVENT_TYPE_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  BASE_LABEL_ZOOM,
  HIGHLIGHT_LABEL_ZOOM,
  LABEL_BASE_OFFSET,
  LABEL_HIGHLIGHT_OFFSET,
} from '@/lib/constants'

type PopupRect = { left: number; right: number; top: number; bottom: number }

function useMapInteraction(map: L.Map) {
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
      requestAnimationFrame(() => {
        interactingRef.current = false
        setTimeout(() => {
          if (!interactingRef.current) setIsInteracting(false)
        }, 80)
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

  return isInteracting
}

function getPopupRect(
  map: L.Map,
  places: Place[],
  openPopupId: string | null,
): PopupRect | null {
  if (!openPopupId) return null
  const anchor = places.find(pl => pl.id === openPopupId)
  if (!anchor) return null

  const pt = map.latLngToContainerPoint([anchor.location.lat, anchor.location.lng])
  const halfW = 140
  const heightAbove = 230
  const heightBelow = 10

  return {
    left: pt.x - halfW,
    right: pt.x + halfW,
    top: pt.y - heightAbove,
    bottom: pt.y + heightBelow,
  }
}

// TODO: replace logic with backend call
function getUpcomingEvent(events: Event[], now: number): Event | undefined {
  if (!events.length) return undefined
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )
  return sorted.find(e => new Date(e.end).getTime() >= now) ?? sorted[0]
}

function computeLabelOpacity(options: {
  isHighlighted: boolean
  isActive: boolean
  hasSelection: boolean
  centerPt: L.Point
  pt: L.Point
  maxDist: number
}) {
  const {isHighlighted, isActive, hasSelection, centerPt, pt, maxDist} = options
  if (isHighlighted || isActive) return 1
  if (hasSelection) return 0.06

  const dist = centerPt.distanceTo(pt)
  const base = 1 - dist / maxDist
  return Math.max(0.15, Math.min(1, base))
}

export function PlaceLabels({
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
  const isInteracting = useMapInteraction(map)

  const size = map.getSize()
  const centerPt = size.divideBy(2)
  const maxDist = Math.min(size.x, size.y) * 0.9
  const zoom = map.getZoom()
  const hasHighlights = !!(highlightIds && highlightIds.length)
  const minLabelZoom = hasHighlights ? HIGHLIGHT_LABEL_ZOOM : BASE_LABEL_ZOOM
  const now = Date.now()
  const popupRect = getPopupRect(map, places, openPopupId)
  const hasSelection = !!openPopupId || hasHighlights

  if (zoom < minLabelZoom) {
    return <div className="absolute inset-0 pointer-events-none z-[600] select-none"/>
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-[600] select-none">
      {places.map(p => {
        const pt = map.latLngToContainerPoint([p.location.lat, p.location.lng])
        if (pt.x < -80 || pt.y < -80 || pt.x > size.x + 80 || pt.y > size.y + 80) return null

        const isHighlighted = !!highlightIds?.includes(p.id)
        const isActive = openPopupId === p.id

        if (!isActive && popupRect) {
          const inside =
            pt.x >= popupRect.left &&
            pt.x <= popupRect.right &&
            pt.y >= popupRect.top &&
            pt.y <= popupRect.bottom
          if (inside) return null
        }

        const events = eventsByPlace.get(p.id) || []
        const upcoming = getUpcomingEvent(events, now)
        if (!upcoming) return null

        const opacity = computeLabelOpacity({
          isHighlighted,
          isActive,
          hasSelection,
          centerPt,
          pt,
          maxDist,
        })

        const offsetY = isHighlighted || isActive ? LABEL_HIGHLIGHT_OFFSET : LABEL_BASE_OFFSET
        const finalOpacity = isActive ? 0 : opacity
        const transform = isActive
          ? `translate(-50%, ${offsetY - 34}px) scale(.6)`
          : `translate(-50%, ${offsetY}px)`

        return (
          <div
            key={`lbl-${p.id}`}
            style={{
              left: pt.x,
              top: pt.y,
              transform,
              opacity: finalOpacity,
            }}
            className={cn(
              'absolute will-change-transform',
              isActive ? 'pointer-events-none' : 'pointer-events-auto',
              isInteracting
                ? 'transition-opacity duration-[160ms] ease-linear'
                : 'transition-opacity [transition-property:opacity,transform] duration-[260ms] [transition-timing-function:cubic-bezier(.4,.2,.2,1)]',
            )}
            aria-hidden={isActive}
          >
            <button
              type="button"
              onClick={() => onOpen(p.id)}
              className="pointer-events-auto focus:outline-none group text-center"
              aria-label={`Open ${upcoming.title}`}
              disabled={isActive}
            >
              <span
                className="block mx-auto text-[11px] font-semibold leading-tight whitespace-nowrap text-slate-800 dark:text-slate-100 drop-shadow-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] group-hover:text-pink-600 dark:group-hover:text-pink-300">
                {upcoming.title}
              </span>
              <div className="mt-0.5 flex items-center gap-1 justify-center">
                <span
                  className="text-[9px] uppercase tracking-wide font-medium text-slate-600 dark:text-slate-400 [text-shadow:0_1px_1px_rgba(0,0,0,0.4)]">
                  {p.name}
                </span>
                <span
                  data-kind={upcoming.kind}
                  className={cn(
                      "text-[9px] leading-none font-semibold px-1 py-0.5 rounded shadow",
                      "[text-shadow:0_1px_1px_rgba(0,0,0,0.35)]",
                      EVENT_TYPE_BADGE_CLASSES[upcoming.kind]
                  )}
                >
                  {EVENT_TYPE_LABELS[upcoming.kind] || upcoming.kind}
                </span>
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}
