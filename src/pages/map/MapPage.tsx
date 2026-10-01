import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { usePlaces, usePlacesById, useUpcomingEvents } from "@/api/hooks";
import type { ID, Place, UpcomingEventByPlace } from "@/api/types";
import { ErrorState, LoadingState } from "@/components/States";
import { BottomBar } from "@/layout/BottomBar";
import { type PlaceFocus, useHighlight } from "@/layout/HighlightProvider";
import { TopBar } from "@/layout/TopBar";
import { type MapViewState, recallMap, rememberMap } from "@/map/mapMemory";
import { MapView } from "@/map/MapView";

import styles from "./MapPage.module.scss";

const NO_PLACES: Place[] = [];

/**
 * Which popup the user opened or closed (null), remembered together with the highlights and focus it happened
 * under: a new search closes it and a newly focused place opens its own, without an effect.
 */
interface PopupState {
    id: ID | null;
    forHighlights: ID[];
    forFocus: PlaceFocus | null;
}

/**
 * Home route: the full-screen map with the places around the viewport and their next events. Highlighted places
 * outside the viewport (search results, a focus link) are loaded one by one so the map can fly to them. The view
 * and the open card are remembered, so coming back (from a detail page, say) lands where the user left off.
 */
export function MapPage() {
    const [searchParams] = useSearchParams();
    const focus = searchParams.get("focus");
    const { highlightIds, focus: focused, focusPlace } = useHighlight();
    const [remembered] = useState(recallMap);

    const [bbox, setBbox] = useState<string | null>(null);
    const [view, setView] = useState<MapViewState | null>(remembered);
    const placesQuery = usePlaces(bbox);
    const upcomingQuery = useUpcomingEvents();
    const inView = placesQuery.data;
    const missingHighlights = useMemo(
        () => (inView ? highlightIds.filter((id) => !inView.some((p) => p.id === id)) : []),
        [inView, highlightIds],
    );
    const highlightedElsewhere = usePlacesById(missingHighlights);
    // Fitting the view waits until every highlighted place is known, or it would fly to the first one to arrive.
    const highlightsSettled = inView !== undefined && !highlightedElsewhere.pending;
    const [popup, setPopup] = useState<PopupState | null>(() =>
        remembered?.popupId ? { id: remembered.popupId, forHighlights: highlightIds, forFocus: focused } : null,
    );

    // Arriving with ?focus=<placeId> (from search on another page) highlights that place and opens its card.
    useEffect(() => {
        if (focus) focusPlace(focus);
    }, [focus, focusPlace]);

    const upcomingMap = useMemo(
        () => new Map<ID, UpcomingEventByPlace>((upcomingQuery.data ?? []).map((u) => [u.placeId, u])),
        [upcomingQuery.data],
    );

    const error = placesQuery.error ?? upcomingQuery.error;
    const loading = placesQuery.isPending || upcomingQuery.isPending;
    const places = useMemo(
        () => (!error && inView && upcomingQuery.data ? [...inView, ...highlightedElsewhere.places] : NO_PLACES),
        [error, inView, upcomingQuery.data, highlightedElsewhere.places],
    );

    const current = popup !== null && popup.forHighlights === highlightIds && popup.forFocus === focused;
    const openPopupId = current ? popup.id : (focused?.id ?? null);

    useEffect(() => {
        if (view) rememberMap({ ...view, popupId: openPopupId });
    }, [view, openPopupId]);
    const showPopup = (id: ID | null) => setPopup({ id, forHighlights: highlightIds, forFocus: focused });
    const togglePopup = (id: ID) => showPopup(openPopupId === id ? null : id);
    const closePopup = () => showPopup(null);

    const reload = () => {
        void placesQuery.refetch();
        void upcomingQuery.refetch();
    };

    return (
        <>
            <TopBar />
            <BottomBar />
            <main className={styles.main}>
                <MapView
                    places={places}
                    upcomingMap={upcomingMap}
                    highlightIds={highlightIds}
                    openPopupId={openPopupId}
                    onOpenPlace={togglePopup}
                    onClosePopup={closePopup}
                    onViewportChange={setBbox}
                    onViewChange={setView}
                    initialView={remembered}
                    highlightsSettled={highlightsSettled}
                />
                {(loading || error) && (
                    <div className={styles.overlay}>
                        <div className={styles.overlayCard}>
                            {error ? (
                                <ErrorState message="Could not load the map." onRetry={reload} />
                            ) : (
                                <LoadingState label="Loading map…" />
                            )}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
