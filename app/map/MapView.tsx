import {MapContainer, Marker, Popup, TileLayer, useMapEvent} from 'react-leaflet'
import L, {LatLngTuple} from 'leaflet'

import type {GeoPoint, Place, UpcomingEventByPlace} from '@/lib/types'
import {toLatLngTuple} from '@/lib/utils'
import PlacePopupCard from '../../components/PlacePopupCard'
import {FitToHighlights} from '@/app/map/map-functions/FitToHighLights'
import {UserLocation} from '@/app/map/map-functions/UserLocation'
import {DesktopZoomControls} from '@/app/map/map-functions/DesktopZoomControls'
import {PlaceLabels} from '@/app/map/map-functions/placeLabels'
import {PanPopupMobile} from '@/app/map/map-functions/PanPopupMobile'

function PinIcon(color: string, shiny: boolean) {
    return L.divIcon({
        className: 'pm-pin-wrapper',
        html: `
      <div class="pm-pin ${shiny ? 'pm-shiny' : ''}" style="--pin:${color}">
        <div class='pm-pin-head'>
          <div class='pm-pin-core'></div>
          <div class='pm-pin-gloss'></div>
          <div class='pm-pin-sparkles'>
            <span class='sp s1'></span>
            <span class='sp s2'></span>
            <span class='sp s3'></span>
          </div>
        </div>
        <div class='pm-pin-tail'></div>
      </div>
    `,
        iconSize: [36, 48],
        iconAnchor: [18, 44],
        popupAnchor: [0, -38],
    })
}

function MapBackgroundCloser({onClose}: { onClose: () => void }) {
    useMapEvent('click', () => onClose())
    return null
}

export default function MapView({
                                    defaultMapCenter,
                                    tileUrl,
                                    places,
                                    upcomingMap,
                                    isDark = false,
                                    highlightIds,
                                    openPopupPlaceId,
                                    popupPlace,
                                    popupUpcomingEvent,
                                    onOpenPlace,
                                    onCloseAllPlaces,
                                    onUserPosition,
                                }: {
    defaultMapCenter: GeoPoint
    tileUrl: string
    places: Place[]
    upcomingMap: Map<string, UpcomingEventByPlace>
    isDark?: boolean
    highlightIds?: string[]
    openPopupPlaceId?: string | null
    popupPlace?: Place | null
    popupUpcomingEvent?: UpcomingEventByPlace | null
    onOpenPlace?: (id: string) => void
    onCloseAllPlaces?: () => void
    onUserPosition?: (pos: GeoPoint) => void
}) {
    const openPopupId = openPopupPlaceId ?? null
    const center = toLatLngTuple(defaultMapCenter)

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom
                zoomControl={false}
                className="h-full w-full"
                style={{zIndex: 0}}
            >
                <TileLayer url={tileUrl}/>

                <UserLocation
                    auto={!(highlightIds && highlightIds.length)}
                    onPosition={onUserPosition}
                />
                <FitToHighlights places={places} highlightIds={highlightIds}/>
                <DesktopZoomControls openPopupId={openPopupId} places={places}/>

                <PlaceLabels
                    places={places}
                    upcomingMap={upcomingMap}
                    highlightIds={highlightIds}
                    openPopupId={openPopupId}
                    onOpen={id => onOpenPlace?.(id)}
                />

                {places.map(p => {
                    const isHighlighted = !!highlightIds?.includes(p.id)
                    const isActive = openPopupId === p.id
                    const shiny = isHighlighted || isActive
                    const baseColor = isActive
                        ? '#ec4899'
                        : isHighlighted
                            ? '#8b5cf6'
                            : isDark
                                ? '#475569'
                                : '#334155'
                    const icon = PinIcon(baseColor, shiny)
                    const pos: LatLngTuple = [p.location.latitude, p.location.longitude]

                    return (
                        <Marker
                            key={p.id}
                            position={pos}
                            icon={icon as any}
                            eventHandlers={{
                                click: () => onOpenPlace?.(p.id),
                            }}
                        />
                    )
                })}

                {popupPlace && (
                    <Popup
                        key={`popup-${popupPlace.id}`}
                        position={
                            [
                                popupPlace.location.latitude,
                                popupPlace.location.longitude,
                            ] as LatLngTuple
                        }
                        autoPan={false}
                        closeButton={false}
                        closeOnClick={false}
                        autoClose={false}
                        offset={[0, -48]}
                        className="place-popup"
                        eventHandlers={{
                            remove: () => onCloseAllPlaces?.(),
                        }}
                    >
                        <PlacePopupCard
                            place={popupPlace}
                            upcomingEvent={popupUpcomingEvent ?? null}
                            onClose={() => onCloseAllPlaces?.()}
                        />
                    </Popup>
                )}

                <PanPopupMobile places={places} openPopupId={openPopupId}/>
                <MapBackgroundCloser onClose={() => onCloseAllPlaces?.()}/>
            </MapContainer>
        </div>
    )
}
