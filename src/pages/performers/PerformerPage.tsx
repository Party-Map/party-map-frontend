import { useMemo } from "react";
import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import { useLikeStatus, usePerformerPage, usePlacesById } from "@/api/hooks";
import type { Event } from "@/api/types";
import { useAuth } from "@/auth/provider";
import { ExpandableText } from "@/components/ExpandableText";
import { SocialLinks } from "@/components/SocialLinks";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import text from "@/components/typography.module.scss";
import { LikeButton } from "@/layout/LikeButton";
import { PageShell } from "@/layout/PageShell";
import { splitByNow } from "@/lib/eventTime";
import { calendarDayLabel } from "@/lib/format";
import { pageTitle, usePageMeta } from "@/lib/seo";
import { Hero } from "@/pages/common/Hero";
import { SharePill } from "@/pages/common/pageActions";
import { StickyTitle } from "@/pages/common/StickyTitle";
import { TrackList, TrackRow } from "@/pages/common/TrackList";
import { NotFoundPage } from "@/pages/NotFoundPage";

import styles from "./PerformerPage.module.scss";

const NO_EVENTS: Event[] = [];

/** Public detail page of a performer: hero, upcoming and past shows with their venues, about. */
export function PerformerPage() {
    const { id = "" } = useParams();
    const { status } = useAuth();
    const page = usePerformerPage(id);
    const likeStatus = useLikeStatus("performers", id, { enabled: status === "authenticated" });
    const events = page.data?.events ?? NO_EVENTS;
    const placeIds = useMemo(() => [...new Set(events.map((event) => event.placeId))], [events]);
    const venues = usePlacesById(placeIds);
    usePageMeta(
        page.data
            ? {
                  title: pageTitle(page.data.performer.name),
                  description: page.data.performer.bio,
                  canonicalPath: `/performers/${id}`,
                  image: page.data.performer.image,
              }
            : null,
    );

    if (page.error instanceof ApiError && page.error.status === 404) return <NotFoundPage />;

    if (page.isPending) {
        return (
            <PageShell>
                <LoadingState />
            </PageShell>
        );
    }

    if (!page.data) {
        return (
            <PageShell>
                <ErrorState message="Could not load this performer." onRetry={() => void page.refetch()} />
            </PageShell>
        );
    }

    const { performer } = page.data;
    const { upcoming, past } = splitByNow(events, new Date());
    const row = (event: Event, index: number) => {
        const venue = venues.places.find((place) => place.id === event.placeId);
        return (
            <TrackRow
                key={event.id}
                index={index + 1}
                to={`/events/${event.id}`}
                image={event.image ?? venue?.image}
                title={event.title}
                secondary={venue && `${venue.name} • ${venue.city}`}
                meta={<time dateTime={event.start}>{calendarDayLabel(event.start)}</time>}
            />
        );
    };
    const shows = upcoming.length === 1 ? "1 upcoming show" : `${upcoming.length} upcoming shows`;

    return (
        <PageShell backTo="/browse/performers">
            <Hero
                image={performer.image}
                alt={performer.name}
                eyebrow={performer.genre}
                title={performer.name}
                subtitle={upcoming.length === 0 ? "No upcoming shows" : shows}
                shape="round"
                actions={
                    <>
                        {!likeStatus.isLoading && (
                            <LikeButton
                                target="performers"
                                targetId={id}
                                targetName={performer.name}
                                initialLiked={likeStatus.data?.liked ?? false}
                            />
                        )}
                        <SharePill title={performer.name} />
                    </>
                }
            />
            <StickyTitle title={performer.name} />

            <section className={styles.section}>
                <h2 className={text.sectionTitle}>Upcoming shows</h2>
                {upcoming.length === 0 ? (
                    <EmptyState message="No events yet." />
                ) : (
                    <TrackList label="Upcoming shows">{upcoming.map(row)}</TrackList>
                )}
                {past.length > 0 && (
                    <details className={styles.past}>
                        <summary className={styles.summary}>Past shows ({past.length})</summary>
                        <TrackList label="Past shows">{past.map(row)}</TrackList>
                    </details>
                )}
            </section>

            <section className={styles.section}>
                <h2 className={text.sectionTitle}>About</h2>
                <ExpandableText text={performer.bio} />
                <SocialLinks links={performer.links} className={styles.links} />
            </section>
        </PageShell>
    );
}
