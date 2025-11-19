import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L, { LatLngTuple } from 'leaflet'
import type { Place } from '@/lib/types'

export function PanPopupMobile({
                                   places,
                                   openPopupId,
                               }: {
    places: Place[]
    openPopupId: string | null
}) {
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
                const bottomBar =
                    64 +
                    16 +
                    (Number.parseInt(
                        getComputedStyle(document.documentElement).getPropertyValue(
                            'env(safe-area-inset-bottom)',
                        ),
                    ) || 0)
                const pinHeight = 48
                const margin = 12
                const desiredPt = L.point(
                    size.x / 2,
                    size.y - (bottomBar + pinHeight + margin),
                )
                const offset = currentPt.subtract(desiredPt)
                if (Math.abs(offset.x) + Math.abs(offset.y) < 6) return
                map.panBy(offset, {animate: true, duration: 0.35})
            } catch {
            }
        })

        return () => {
            if (frame) cancelAnimationFrame(frame)
        }
    }, [openPopupId, places, map])

    return null
}
