import {useEffect} from 'react'
import {useMap} from 'react-leaflet'
import L, {LatLngTuple} from 'leaflet'
import type {ID, Place} from '@/lib/types'

export function FitToHighlights({places, highlightIds}: {
    places: Place[]
    highlightIds?: ID[]
}) {
    const map = useMap()

    useEffect(() => {
        if (!highlightIds || !highlightIds.length) return
        const targets = places.filter(p => highlightIds.includes(p.id))
        if (!targets.length) return

        if (targets.length === 1) {
            const t = targets[0]
            map.flyTo([t.location.latitude, t.location.longitude], 15, {duration: 0.6})
            return
        }

        const bounds = L.latLngBounds(
            targets.map(t => [t.location.latitude, t.location.longitude]) as LatLngTuple[],
        )
        // Padding bounds size to avoid cutting off markers at edges
        map.flyToBounds(bounds.pad(0.2), {duration: 0.8})
    }, [highlightIds, places, map])

    return null
}
