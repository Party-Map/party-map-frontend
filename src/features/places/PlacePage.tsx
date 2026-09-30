import { useParams } from "react-router";
import { Card, CardBody } from "@/components/Card";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/components/LikeButton";
import { PageShell } from "@/components/PageShell";
import { SocialLinks } from "@/components/SocialLinks";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { ApiError } from "@/lib/api/client";
import { fetchEventsByPlace } from "@/lib/api/events";
import { fetchLikeStatus } from "@/lib/api/likes";
import { fetchPlace } from "@/lib/api/places";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cx } from "@/lib/cx";
import { useResource } from "@/lib/hooks/useResource";
import type { Event, ID, Place } from "@/lib/types";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { EventCard } from "./EventCard";
import styles from "./PlacePage.module.css";

type PlacePageData = { place: Place; events: Event[] };

async function loadPlacePage(id: ID): Promise<PlacePageData> {
    const [place, events] = await Promise.all([fetchPlace(id), fetchEventsByPlace(id)]);
    return { place, events };
}

/** Public detail page of a place with its upcoming events. */
export function PlacePage() {
    const { id = "" } = useParams();
    const { status } = useAuth();
    const page = useResource(() => loadPlacePage(id), [id]);
    const likeStatus = useResource(() => fetchLikeStatus("places", id), [id], { enabled: status === "authenticated" });

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
                <ErrorState message="Could not load this place." onRetry={page.reload} />
            </PageShell>
        );
    }

    const { place, events } = page.data;

    return (
        <PageShell
            footer={
                <>
                    <h2 className="section-title">Upcoming events</h2>
                    {events.length === 0 ? (
                        <EmptyState message="No events yet." />
                    ) : (
                        <div className={styles.events}>
                            {events.map((event) => (
                                <EventCard key={event.id} event={event} place={place} />
                            ))}
                        </div>
                    )}
                </>
            }
        >
            <Card>
                <CoverImage src={place.image} alt={place.name} />
                <CardBody>
                    <div className={styles.titleRow}>
                        <h1 className={cx("page-title", styles.title)}>{place.name}</h1>
                        {!likeStatus.loading && (
                            <LikeButton
                                target="places"
                                targetId={id}
                                targetName={place.name}
                                initialLiked={likeStatus.data?.liked ?? false}
                            />
                        )}
                    </div>
                    <p className={styles.metaLine}>
                        {place.address}, {place.city}
                    </p>
                    <p className={styles.description}>{place.description}</p>
                    {place.tags.length > 0 && (
                        <ul className={styles.tags} aria-label="Tags">
                            {place.tags.map((tag) => (
                                <li key={tag} className={styles.tag}>
                                    {tag}
                                </li>
                            ))}
                        </ul>
                    )}
                    <SocialLinks links={place.links} className={styles.links} />
                </CardBody>
            </Card>
        </PageShell>
    );
}
