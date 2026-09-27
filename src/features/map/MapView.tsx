import { useMemo } from 'react'
import type { PointTuple } from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMapEvent } from 'react-leaflet'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, TILE_ATTRIBUTION, TILE_URL } from '@/lib/constants'
import type { ID, Place, UpcomingEventByPlace } from '@/lib/types'
import { FitToHighlights } from './FitToHighlights'
import { toLatLngTuple } from './geo'
import { PanPopupMobile } from './PanPopupMobile'
import { PlaceLabels } from './PlaceLabels'
import { PlacePopupCard } from './PlacePopupCard'
import { getPinIcon } from './pins'
import { UserLocation } from './UserLocation'
import { ZoomControls } from './ZoomControls'
import './pins.css'
import styles from './MapView.module.css'

/** Lifts the popup so it floats above the pin head. */
const POPUP_OFFSET: PointTuple = [0, -48]
/** Wider than the card at any breakpoint, so Leaflet measures the real width and centres it. */
const POPUP_MAX_WIDTH = 400

function BackgroundCloser({ onClose }: { onClose: () => void }) {
  useMapEvent('click', onClose)
  return null
}

type MapViewProps = {
  places: Place[]
  upcomingMap: Map<ID, UpcomingEventByPlace>
  highlightIds: ID[]
  openPopupId: ID | null
  onOpenPlace: (id: ID) => void
  onClosePopup: () => void
}

/** The Leaflet map: tiles, pins, labels, controls and the popup for the open place. */
export function MapView({ places, upcomingMap, highlightIds, openPopupId, onOpenPlace, onClosePopup }: MapViewProps) {
  // Memoised so the popup position stays referentially stable: react-leaflet re-opens the popup
  // whenever it receives a new position.
  const popup = useMemo(() => {
    const place = places.find((p) => p.id === openPopupId)
    return place ? { place, position: toLatLngTuple(place.location) } : null
  }, [places, openPopupId])

  return (
    <div className={styles.root}>
      <MapContainer
        center={toLatLngTuple(DEFAULT_MAP_CENTER)}
        zoom={DEFAULT_MAP_ZOOM}
        scrollWheelZoom
        zoomControl={false}
        className={styles.map}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        <UserLocation auto={highlightIds.length === 0} />
        <FitToHighlights places={places} highlightIds={highlightIds} />
        <ZoomControls places={places} openPopupId={openPopupId} />
        <PlaceLabels
          places={places}
          upcomingMap={upcomingMap}
          highlightIds={highlightIds}
          openPopupId={openPopupId}
          onOpen={onOpenPlace}
        />

        {places.map((place) => (
          <Marker
            key={place.id}
            position={toLatLngTuple(place.location)}
            icon={getPinIcon({ isActive: place.id === openPopupId, isHighlighted: highlightIds.includes(place.id) })}
            eventHandlers={{ click: () => onOpenPlace(place.id) }}
          />
        ))}

        {popup && (
          <Popup
            key={popup.place.id}
            position={popup.position}
            autoPan={false}
            closeButton={false}
            closeOnClick={false}
            autoClose={false}
            offset={POPUP_OFFSET}
            maxWidth={POPUP_MAX_WIDTH}
            eventHandlers={{ remove: onClosePopup }}
          >
            <PlacePopupCard place={popup.place} upcomingEvent={upcomingMap.get(popup.place.id) ?? null} onClose={onClosePopup} />
          </Popup>
        )}

        <PanPopupMobile places={places} openPopupId={openPopupId} />
        <BackgroundCloser onClose={onClosePopup} />
      </MapContainer>
    </div>
  )
}
