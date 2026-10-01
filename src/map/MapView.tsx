import "./leaflet.scss";

import type { PointTuple } from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, Popup, useMapEvent } from "react-leaflet";

import type { ID, Place, UpcomingEventByPlace } from "@/api/types";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAP_MAX_ZOOM } from "@/lib/constants";

import { FitToHighlights } from "./FitToHighlights";
import { toLatLngTuple } from "./geo";
import { LazyBasemap } from "./LazyBasemap";
import type { MapViewState } from "./mapMemory";
import styles from "./MapView.module.scss";
import { PanPopupMobile } from "./PanPopupMobile";
import { getPinIcon } from "./pins";
import { PlaceLabels } from "./PlaceLabels";
import { PlacePopupCard } from "./PlacePopupCard";
import { Sky } from "./Sky";
import { UserLocation } from "./UserLocation";
import { ViewportWatcher } from "./ViewportWatcher";
import { ZoomControls } from "./ZoomControls";
import { ZoomFloor } from "./ZoomFloor";

/** Lifts the popup so it floats above the pin head. */
const POPUP_OFFSET: PointTuple = [0, -48];
/** Wider than the card at any breakpoint, so Leaflet measures the real width and centres it. */
const POPUP_MAX_WIDTH = 400;

function BackgroundCloser({ onClose }: { onClose: () => void }) {
    useMapEvent("click", onClose);
    return null;
}

interface MapViewProps {
    places: Place[];
    upcomingMap: Map<ID, UpcomingEventByPlace>;
    highlightIds: ID[];
    openPopupId: ID | null;
    onOpenPlace: (id: ID) => void;
    onClosePopup: () => void;
    /** Called with the `bbox` to load places for, on mount and after every pan or zoom. */
    onViewportChange?: (bbox: string) => void;
    /** Called with the centre and zoom on mount and after every pan or zoom, for remembering the view. */
    onViewChange?: (view: MapViewState) => void;
    /** Where the map starts; the remembered view when the user comes back, Budapest otherwise. */
    initialView?: MapViewState | null;
    /** False while highlighted places are still loading; the view is fitted to them once they are all there. */
    highlightsSettled?: boolean;
}

/** The Leaflet map: basemap, pins, labels, controls and the popup for the open place. */
export function MapView({
    places,
    upcomingMap,
    highlightIds,
    openPopupId,
    onOpenPlace,
    onClosePopup,
    onViewportChange,
    onViewChange,
    initialView = null,
    highlightsSettled = true,
}: MapViewProps) {
    // Memoised so the popup position stays referentially stable: react-leaflet re-opens the popup
    // whenever it receives a new position.
    const popup = useMemo(() => {
        const place = places.find((p) => p.id === openPopupId);
        return place ? { place, position: toLatLngTuple(place.location) } : null;
    }, [places, openPopupId]);

    return (
        <div className={styles.root}>
            <MapContainer
                center={initialView?.center ?? toLatLngTuple(DEFAULT_MAP_CENTER)}
                zoom={initialView?.zoom ?? DEFAULT_MAP_ZOOM}
                maxZoom={MAP_MAX_ZOOM}
                scrollWheelZoom
                zoomControl={false}
                attributionControl={false}
                className={styles.map}
            >
                <Sky />
                <LazyBasemap />
                <ZoomFloor />

                {(onViewportChange ?? onViewChange) && (
                    <ViewportWatcher onChange={onViewportChange} onViewChange={onViewChange} />
                )}
                {/* A restored view is where the user left off: no flight to the device position. */}
                <UserLocation auto={highlightIds.length === 0 && initialView === null} />
                <FitToHighlights places={places} highlightIds={highlightIds} ready={highlightsSettled} />
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
                        icon={getPinIcon({
                            isActive: place.id === openPopupId,
                            isHighlighted: highlightIds.includes(place.id),
                        })}
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
                        <PlacePopupCard
                            place={popup.place}
                            upcomingEvent={upcomingMap.get(popup.place.id) ?? null}
                            onClose={onClosePopup}
                        />
                    </Popup>
                )}

                <PanPopupMobile places={places} openPopupId={openPopupId} />
                <BackgroundCloser onClose={onClosePopup} />
            </MapContainer>
        </div>
    );
}
