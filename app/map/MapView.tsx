import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L, { LatLngTuple } from 'leaflet'
import {useMemo} from 'react'

import type {Event, Place} from '@/lib/types'
import type {LatLng} from '@/lib/types'
import PlacePopupCard from '../../components/PlacePopupCard'
import {FitToHighlights} from "@/app/map/map-functions/FitToHighLights";
import {UserLocation} from "@/app/map/map-functions/UserLocation";
import {DesktopZoomControls} from "@/app/map/map-functions/DesktopZoomControls";
import {PlaceLabels} from "@/app/map/map-functions/placeLabels";
import {PanPopupMobile} from "@/app/map/map-functions/PanPopupMobile";

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
          </div>`,
        iconSize: [36, 48],
        iconAnchor: [18, 44],
        popupAnchor: [0, -38],
    })
}
import {useMapEvent} from 'react-leaflet'

function MapBackgroundCloser({ onClose }: { onClose: () => void }) {
    useMapEvent('click', () => onClose())
    return null
}

interface Props {
    places: Place[]
    events: Event[]
    isDark?: boolean
    highlightIds?: string[]
    openPopupPlaceId?: string | null
    onOpenPlace?: (id: string) => void
    onCloseAllPlaces?: () => void
    onUserPosition?: (pos: LatLng) => void
}
export default function MapView({
                                    places,
                                    events,
                                    isDark = false,
                                    highlightIds,
                                    openPopupPlaceId,
                                    onOpenPlace,
                                    onCloseAllPlaces,
                                    onUserPosition,
                                }: Props) {

    const eventsByPlace = useMemo(() => {
        const map = new Map<string, Event[]>()
        for (const e of events) {
            map.set(e.placeId, [...(map.get(e.placeId) || []), e])
        }
        return map
    }, [events])

    const openPopupId = openPopupPlaceId ?? null

    const center: LatLngTuple = [47.4979, 19.0402]
    const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

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

                <FitToHighlights places={places} highlightIds={highlightIds}/>

                <UserLocation onPosition={onUserPosition}/>

                <DesktopZoomControls openPopupId={openPopupId} places={places}/>

                <PlaceLabels
                    places={places}
                    eventsByPlace={eventsByPlace}
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
                    const pos: LatLngTuple = [p.location.lat, p.location.lng]
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

                {(() => {
                    const p = openPopupId ? places.find(x => x.id === openPopupId) : undefined
                    if (!p) return null
                    return (
                        <Popup
                            key={`popup-${p.id}`}
                            position={[p.location.lat, p.location.lng] as LatLngTuple}
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
                                place={p}
                                onClose={() => onCloseAllPlaces?.()}
                            />
                        </Popup>
                    )
                })()}
                <PanPopupMobile places={places} openPopupId={openPopupId}/>
                <MapBackgroundCloser onClose={() => onCloseAllPlaces?.()}/>
            </MapContainer>
        </div>
    )
}
