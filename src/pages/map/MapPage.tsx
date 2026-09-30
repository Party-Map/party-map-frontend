import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { usePlaces, usePlacesById, useUpcomingEvents } from "@/api/hooks";
import type { ID, Place, UpcomingEventByPlace } from "@/api/types";
import { ErrorState, LoadingState } from "@/components/States";
import { BottomBar } from "@/layout/BottomBar";
import { useHighlight } from "@/layout/HighlightProvider";
import { TopBar } from "@/layout/TopBar";
import { MapView } from "@/map/MapView";

import styles from "./MapPage.module.scss";

const NO_PLACES: Place[] = [];

/**
 * Which popup is open, remembered together with the highlight set it was opened under: a
 * change of highlights (search, focus) closes it without an effect.
 */
interface PopupState {
    id: ID;
    forHighlights: ID[];
}

/**
 * Home route: the full-screen map with the places around the viewport and their next events. Highlighted places
 * outside the viewport (search results, a focus link) are loaded one by one so the map can fly to them.
 */
export function MapPage() {
    const [searchParams] = useSearchParams();
    const focus = searchParams.get("focus");
    const { highlightIds, setHighlightIds } = useHighlight();

    const [bbox, setBbox] = useState<string | null>(null);
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
    const [popup, setPopup] = useState<PopupState | null>(null);

    // Arriving with ?focus=<placeId> (from search on another page) highlights that place.
    useEffect(() => {
        if (focus) setHighlightIds([focus]);
    }, [focus, setHighlightIds]);

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

    const openPopupId = popup !== null && popup.forHighlights === highlightIds ? popup.id : null;
    const togglePopup = (id: ID) => setPopup(openPopupId === id ? null : { id, forHighlights: highlightIds });
    const closePopup = useCallback(() => setPopup(null), []);

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
