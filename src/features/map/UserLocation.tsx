import { useEffect, useMemo, useState } from 'react'
import type { LatLngTuple } from 'leaflet'
import { Circle, Marker, useMap } from 'react-leaflet'
import { createYouAreHereIcon } from './pins'

/** Accuracy circles larger than this would swallow the map; cap them. */
export const MAX_ACCURACY_RADIUS_M = 200
const FIRST_FIX_MIN_ZOOM = 14
const POSITION_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 10_000 }

type Fix = { position: LatLngTuple; accuracy: number }

function toFix(position: GeolocationPosition): Fix {
  return { position: [position.coords.latitude, position.coords.longitude], accuracy: position.coords.accuracy }
}

/**
 * "You are here" marker with an accuracy circle, following the device position. When `auto` the
 * map flies to the first fix; it is off while highlights own the viewport.
 */
export function UserLocation({ auto }: { auto: boolean }) {
  const map = useMap()
  const [fix, setFix] = useState<Fix | null>(null)
  const icon = useMemo(() => createYouAreHereIcon(), [])

  useEffect(() => {
    if (!auto || !('geolocation' in navigator)) return
    const { geolocation } = navigator

    geolocation.getCurrentPosition(
      (position) => {
        const next = toFix(position)
        setFix(next)
        map.flyTo(next.position, Math.max(map.getZoom(), FIRST_FIX_MIN_ZOOM), { duration: 0.8 })
      },
      () => {},
      POSITION_OPTIONS,
    )
    const watchId = geolocation.watchPosition((position) => setFix(toFix(position)), () => {}, POSITION_OPTIONS)

    return () => geolocation.clearWatch(watchId)
  }, [map, auto])

  if (!fix) return null

  return (
    <>
      {fix.accuracy > 0 && (
        <Circle
          center={fix.position}
          radius={Math.min(fix.accuracy, MAX_ACCURACY_RADIUS_M)}
          pathOptions={{ className: 'pm-you-accuracy' }}
        />
      )}
      <Marker position={fix.position} icon={icon} interactive={false} keyboard={false} />
    </>
  )
}
