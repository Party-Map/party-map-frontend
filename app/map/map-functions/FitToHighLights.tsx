import {useEffect} from 'react'
import {useMap} from 'react-leaflet'
import L, {LatLngTuple} from 'leaflet'
import type {Place} from '@/lib/types'

export function FitToHighlights({
                                    places,
                                    highlightIds,
                                }: {
    places: Place[]
    highlightIds?: string[]
}) {
    const map = useMap()

    useEffect(() => {
        if (!highlightIds || !highlightIds.length) return
        const targets = places.filter(p => highlightIds.includes(p.id))
        if (!targets.length) return

        if (targets.length === 1) {
            const t = targets[0]
            map.flyTo([t.location.lat, t.location.lng], 15, {duration: 0.6})
            return
        }

        const bounds = L.latLngBounds(
            targets.map(t => [t.location.lat, t.location.lng]) as LatLngTuple[],
        )
        map.flyToBounds(bounds.pad(0.2), {duration: 0.8})
    }, [highlightIds, places, map])

    return null
}
