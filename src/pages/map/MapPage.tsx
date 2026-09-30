import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { usePlaces, useUpcomingEvents } from "@/api/hooks";
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

/** Home route: the full-screen map with every place and its next event. */
export function MapPage() {
    const [searchParams] = useSearchParams();
    const focus = searchParams.get("focus");
    const { highlightIds, setHighlightIds } = useHighlight();

    const placesQuery = usePlaces();
    const upcomingQuery = useUpcomingEvents();
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
    const places = !error && placesQuery.data && upcomingQuery.data ? placesQuery.data : NO_PLACES;

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
