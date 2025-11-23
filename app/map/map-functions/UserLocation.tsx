import {useEffect, useState} from 'react'
import {Circle, Marker, useMap} from 'react-leaflet'
import {LatLngTuple} from 'leaflet'
import type {GeoPoint} from '@/lib/types'
import {YouAreHereIcon} from "@/components/MapIcons";

export function UserLocation({auto = true, onPosition}: {
    auto?: boolean
    onPosition?: (pos: GeoPoint) => void
}) {
    const map = useMap()
    const [pos, setPos] = useState<LatLngTuple | null>(null)
    const [accuracy, setAccuracy] = useState<number | null>(null)

    useEffect(() => {
        if (!auto || typeof window === 'undefined' || !('geolocation' in navigator)) return

        const opts: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 10000,
        }

        const handlePosition = (g: GeolocationPosition) => {
            const p: LatLngTuple = [g.coords.latitude, g.coords.longitude]
            setPos(p)
            setAccuracy(g.coords.accuracy ?? null)
            onPosition?.({latitude: p[0], longitude: p[1]})
        }

        navigator.geolocation.getCurrentPosition(
            g => {
                handlePosition(g)
                try {
                    const p: LatLngTuple = [g.coords.latitude, g.coords.longitude]
                    map.flyTo(p, Math.max(map.getZoom(), 14), {duration: 0.8})
                } catch {
                }
            },
            () => {
            },
            opts,
        )

        const id = navigator.geolocation.watchPosition(
            g => handlePosition(g),
            () => {
            },
            opts,
        )

        return () => {
            try {
                navigator.geolocation.clearWatch?.(id as any)
            } catch {
            }
        }
    }, [map, auto, onPosition])

    if (!pos) return null

    return (
        <>
            {accuracy && (
                <Circle
                    center={pos as any}
                    radius={Math.min(accuracy, 200)}
                    pathOptions={{
                        color: '#60a5fa',
                        weight: 1,
                        opacity: 0.8,
                        fillColor: '#60a5fa',
                        fillOpacity: 0.12,
                    }}
                />
            )}
            <Marker position={pos} icon={YouAreHereIcon() as any}/>
        </>
    )
}
