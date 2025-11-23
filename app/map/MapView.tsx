import {MapContainer, Marker, Popup, TileLayer, useMapEvent} from 'react-leaflet'
import {LatLngTuple} from 'leaflet'

import type {GeoPoint, Place, UpcomingEventByPlace} from '@/lib/types'
import {toLatLngTuple} from '@/lib/utils'
import PlacePopupCard from '../../components/PlacePopupCard'
import {FitToHighlights} from '@/app/map/map-functions/FitToHighLights'
import {UserLocation} from '@/app/map/map-functions/UserLocation'
import {DesktopZoomControls} from '@/app/map/map-functions/DesktopZoomControls'
import {PlaceLabels} from '@/app/map/map-functions/PlaceLabels'
import {PanPopupMobile} from '@/app/map/map-functions/PanPopupMobile'
import {PinIcon} from '@/components/MapIcons'

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
                    const icon = PinIcon({
                        isActive,
                        isHighlighted,
                        isDark,
                    })

                    const pos: LatLngTuple = [
                        p.location.latitude,
                        p.location.longitude,
                    ]

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
