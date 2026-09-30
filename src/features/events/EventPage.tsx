import { Link, useParams } from "react-router";

import { Card, CardBody } from "@/components/Card";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/components/LikeButton";
import { PageShell } from "@/components/PageShell";
import { SocialLinks } from "@/components/SocialLinks";
import { ErrorState, LoadingState } from "@/components/States";
import { ApiError } from "@/lib/api/client";
import { fetchEvent } from "@/lib/api/events";
import { fetchLikeStatus } from "@/lib/api/likes";
import { fetchPlaceByEventId } from "@/lib/api/places";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cx } from "@/lib/cx";
import { formatDateTimeRange } from "@/lib/dates";
import { useResource } from "@/lib/hooks/useResource";
import type { Event, ID, Place } from "@/lib/types";
import { NotFoundPage } from "@/pages/NotFoundPage";

import styles from "./EventPage.module.css";
import { LineupList } from "./LineupList";

interface EventPageData {
    event: Event;
    place: Place | null;
}

/** An event without a venue is unusual but not fatal; only the event itself decides "not found". */
async function loadPlaceIfAny(eventId: ID): Promise<Place | null> {
    try {
        return await fetchPlaceByEventId(eventId);
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    }
}

async function loadEventPage(id: ID): Promise<EventPageData> {
    const [event, place] = await Promise.all([fetchEvent(id), loadPlaceIfAny(id)]);
    return { event, place };
}

/** Public detail page of an event with its lineup. */
export function EventPage() {
    const { id = "" } = useParams();
    const { status } = useAuth();
    const page = useResource(() => loadEventPage(id), [id]);
    const likeStatus = useResource(() => fetchLikeStatus("events", id), [id], { enabled: status === "authenticated" });

    if (page.error instanceof ApiError && page.error.status === 404) return <NotFoundPage />;

    if (page.loading) {
        return (
            <PageShell>
                <LoadingState />
            </PageShell>
        );
    }

    if (!page.data) {
        return (
            <PageShell>
                <ErrorState message="Could not load this event." onRetry={page.reload} />
            </PageShell>
        );
    }

    const { event, place } = page.data;

    return (
        <PageShell footer={event.lineupItems && <LineupList items={event.lineupItems} />}>
            <Card>
                <CoverImage src={event.image} alt={event.title} />
                <CardBody>
                    <div className={styles.titleRow}>
                        <h1 className={cx("page-title", styles.title)}>{event.title}</h1>
                        {!likeStatus.loading && (
                            <LikeButton
                                target="events"
                                targetId={id}
                                targetName={event.title}
                                initialLiked={likeStatus.data?.liked ?? false}
                            />
                        )}
                    </div>
                    <p className={styles.metaLine}>{formatDateTimeRange(event.start, event.end)}</p>
                    {place && (
                        <p className={styles.metaLine}>
                            at{" "}
                            <Link to={`/places/${place.id}`} className="link">
                                {place.name}
                            </Link>
                        </p>
                    )}
                    {event.price && <p className={styles.price}>Price: {event.price}</p>}
                    <p className={styles.description}>{event.description}</p>
                    <SocialLinks links={event.links} className={styles.links} />
                </CardBody>
            </Card>
        </PageShell>
    );
}
