import {useEffect} from 'react'
import {useMap} from 'react-leaflet'
import L, {LatLngTuple} from 'leaflet'
import type {ID, Place} from '@/lib/types'

export function PanPopupMobile({
                                   places,
                                   openPopupId,
                               }: {
    places: Place[]
    openPopupId: ID | null
}) {
    const map = useMap()

    useEffect(() => {
        if (!openPopupId) return
        if (typeof window === 'undefined' || window.innerWidth >= 768) return
        const place = places.find((p) => p.id === openPopupId)
        if (!place) return

        let frame: number | null = null
        frame = requestAnimationFrame(() => {
            try {
                const latlng: LatLngTuple = [
                    place.location.latitude,
                    place.location.longitude,
                ]
                const currentPt = map.latLngToContainerPoint(latlng)
                const size = map.getSize()

                const bottomBar = 64 + 16
                const pinHeight = 48
                const margin = 12

                const desiredPt = L.point(
                    size.x / 2,
                    size.y - (bottomBar + pinHeight + margin),
                )

                const offset = currentPt.subtract(desiredPt)

                // Avoid small movements
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
