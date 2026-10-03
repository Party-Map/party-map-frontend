import "./leaflet.scss";

import type { PointTuple, Popup as LeafletPopup } from "leaflet";
import { useCallback, useRef, useState } from "react";
import { MapContainer, Popup, useMapEvent } from "react-leaflet";

import type { ID, Place, UpcomingEventByPlace } from "@/api/types";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAP_MAX_ZOOM } from "@/lib/constants";

import { type AnchoredRect } from "./camera";
import { CameraDirector, type RestoredMap } from "./CameraDirector";
import { CardMeasure } from "./CardMeasure";
import { toLatLngTuple, useStableLatLng } from "./geo";
import { LazyBasemap } from "./LazyBasemap";
import { MapLimits } from "./MapLimits";
import type { MapViewState } from "./mapMemory";
import { MapProbe } from "./MapProbe";
import styles from "./MapView.module.scss";
import { PlaceLabels } from "./PlaceLabels";
import { PlacePins } from "./PlacePins";
import { PlacePopupCard } from "./PlacePopupCard";
import { Sky } from "./Sky";
import { UserLocation } from "./UserLocation";
import { ViewportWatcher } from "./ViewportWatcher";
import { ZoomControls } from "./ZoomControls";

/** Lifts the popup so it floats above the pin head. */
const POPUP_OFFSET: PointTuple = [0, -48];
/** Wider than the card at any breakpoint, so Leaflet measures the real width and centres it. */
const POPUP_MAX_WIDTH = 400;

function BackgroundCloser({ onClose }: { onClose: () => void }) {
    useMapEvent("click", onClose);
    return null;
}

interface MeasuredCard {
    id: ID;
    rect: AnchoredRect;
}

interface MapViewProps {
    places: Place[];
    upcomingMap: Map<ID, UpcomingEventByPlace>;
    highlightIds: ID[];
    /** Bumped by every user-driven change of the highlights; the map fits them once per bump. */
    generation: number;
    openPopupId: ID | null;
    /** A stable function (it re-binds every pin's click handler when it changes). */
    onOpenPlace: (id: ID) => void;
    onClosePopup: () => void;
    /** Called with the `bbox` to load places for, on mount and after every pan or zoom. */
    onViewportChange?: (bbox: string) => void;
    /** Called with the centre and zoom on mount and after every pan or zoom, for remembering the view. */
    onViewChange?: (view: MapViewState) => void;
    /** Where the map starts: the remembered view when the user comes back, Budapest otherwise. */
    initialView?: MapViewState | null;
    /** The remembered card and search generation as the page found them, when the view was restored. */
    restored?: RestoredMap | null;
    /** False while highlighted places are still loading; the view is fitted to them once they are all there. */
    highlightsSettled?: boolean;
}

/** The Leaflet map: basemap, pins, labels, controls, the popup for the open place and the camera that moves it. */
export function MapView({
    places,
    upcomingMap,
    highlightIds,
    generation,
    openPopupId,
    onOpenPlace,
    onClosePopup,
    onViewportChange,
    onViewChange,
    initialView = null,
    restored = null,
    highlightsSettled = true,
}: MapViewProps) {
    // The popup position is keyed on the coordinates, not on the places array: react-leaflet tears the popup down
    // and re-opens it whenever it receives a new position object, and the array changes after every viewport load.
    const openPlace = openPopupId === null ? undefined : places.find((p) => p.id === openPopupId);
    const position = useStableLatLng(openPlace?.location.latitude, openPlace?.location.longitude);
    const popup = openPlace && position ? { place: openPlace, position } : null;

    const popupRef = useRef<LeafletPopup>(null);
    const [card, setCard] = useState<MeasuredCard | null>(null);
    const cardRect = card !== null && card.id === openPlace?.id ? card.rect : null;
    const onMeasured = useCallback((id: ID, rect: AnchoredRect) => setCard({ id, rect }), []);

    return (
        <div className={styles.root}>
            <MapContainer
                center={initialView?.center ?? toLatLngTuple(DEFAULT_MAP_CENTER)}
                zoom={initialView?.zoom ?? DEFAULT_MAP_ZOOM}
                maxZoom={MAP_MAX_ZOOM}
                // A solid wall (MapLimits sets the bounds: the country's extent plus the bars' cover, and the zoom
                // floor), so the country cannot be pushed off the screen.
                maxBoundsViscosity={1}
                // Fractional zoom: a pinch ends where the fingers stop (no snap to a whole level), the floor is where
                // the country exactly fills the free area, and the floor is a hard stop for a pinch too.
                zoomSnap={0}
                bounceAtZoomLimits={false}
                scrollWheelZoom
                zoomControl={false}
                attributionControl={false}
                className={styles.map}
            >
                <Sky />
                <LazyBasemap />
                <MapLimits />

                {(onViewportChange ?? onViewChange) && (
                    <ViewportWatcher onChange={onViewportChange} onViewChange={onViewChange} />
                )}
                {/* A restored view is where the user left off: no flight to the device position. */}
                <UserLocation
                    auto={highlightIds.length === 0 && initialView === null}
                    cardOpen={openPopupId !== null}
                />
                <CameraDirector
                    places={places}
                    highlightIds={highlightIds}
                    generation={generation}
                    ready={highlightsSettled}
                    openPopupId={openPopupId}
                    openPlace={openPlace}
                    cardRect={cardRect}
                    restored={restored}
                />
                <ZoomControls places={places} openPopupId={openPopupId} cardRect={cardRect} />
                <PlaceLabels
                    places={places}
                    upcomingMap={upcomingMap}
                    highlightIds={highlightIds}
                    openPopupId={openPopupId}
                    cardRect={cardRect}
                    onOpen={onOpenPlace}
                />
                <PlacePins places={places} openPopupId={openPopupId} highlightIds={highlightIds} onOpen={onOpenPlace} />

                {popup && (
                    <Popup
                        ref={popupRef}
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
                        <CardMeasure
                            popupRef={popupRef}
                            cardId={popup.place.id}
                            anchor={popup.position}
                            onMeasured={onMeasured}
                        />
                    </Popup>
                )}

                <BackgroundCloser onClose={onClosePopup} />
                {import.meta.env.DEV && <MapProbe />}
            </MapContainer>
        </div>
    );
}
