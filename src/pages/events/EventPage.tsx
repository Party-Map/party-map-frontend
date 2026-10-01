import { Ticket } from "lucide-react";
import { Link, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { useEventPage, useEventsByPlace, useLikeStatus } from "@/api/hooks";
import type { LineupItem } from "@/api/types";
import { useAuth } from "@/auth/provider";
import { ExpandableText } from "@/components/ExpandableText";
import { KindBadge } from "@/components/KindBadge";
import { SocialLinks } from "@/components/SocialLinks";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import text from "@/components/typography.module.scss";
import { LikeButton } from "@/layout/LikeButton";
import { PageShell } from "@/layout/PageShell";
import { splitByNow } from "@/lib/eventTime";
import { calendarDayLabel, formatDateTimeRange, formatTime, parseDate } from "@/lib/format";
import { Hero } from "@/pages/common/Hero";
import { MediaCard } from "@/pages/common/MediaCard";
import { DirectionsPill, MapPill, SharePill } from "@/pages/common/pageActions";
import { Shelf } from "@/pages/common/Shelf";
import { StickyTitle } from "@/pages/common/StickyTitle";
import { TrackList, TrackRow } from "@/pages/common/TrackList";
import { NotFoundPage } from "@/pages/NotFoundPage";

import styles from "./EventPage.module.scss";

function byStartTime(a: LineupItem, b: LineupItem): number {
    return parseDate(a.startTime).getTime() - parseDate(b.startTime).getTime();
}

/** Public detail page of an event: hero, lineup, about, and the venue's other upcoming events. */
export function EventPage() {
    const { id = "" } = useParams();
    const { status } = useAuth();
    const page = useEventPage(id);
    const likeStatus = useLikeStatus("events", id, { enabled: status === "authenticated" });
    const venueEvents = useEventsByPlace(page.data?.place?.id ?? null);

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
                <ErrorState message="Could not load this event." onRetry={() => void page.refetch()} />
            </PageShell>
        );
    }

    const { event, place } = page.data;
    const lineup = [...event.lineupItems].sort(byStartTime);
    const moreAtVenue = splitByNow(venueEvents.data ?? [], new Date()).upcoming.filter(
        (other) => other.id !== event.id,
    );

    return (
        <PageShell backTo="/browse/events" backLabel="Events">
            <Hero
                image={event.image ?? place?.image}
                alt={event.title}
                eyebrow={
                    <>
                        <KindBadge kind={event.kind} size="sm" />
                        <span>{calendarDayLabel(event.start)}</span>
                    </>
                }
                title={event.title}
                subtitle={
                    <>
                        <time dateTime={event.start}>{formatDateTimeRange(event.start, event.end)}</time>
                        {place && (
                            <>
                                {" • "}
                                <address>
                                    <Link to={`/places/${place.id}`}>
                                        {place.name}, {place.city}
                                    </Link>
                                </address>
                            </>
                        )}
                    </>
                }
                actions={
                    <>
                        {place && <MapPill placeId={place.id} />}
                        {place && <DirectionsPill point={place.location} />}
                        {!likeStatus.isLoading && (
                            <LikeButton
                                target="events"
                                targetId={id}
                                targetName={event.title}
                                initialLiked={likeStatus.data?.liked ?? false}
                            />
                        )}
                        <SharePill title={event.title} />
                    </>
                }
            />
            <StickyTitle title={event.title} action={place && <MapPill placeId={place.id} />} />

            <section className={styles.section}>
                <h2 className={text.sectionTitle}>Lineup</h2>
                {lineup.length === 0 ? (
                    <EmptyState message="No lineup announced yet." />
                ) : (
                    <TrackList label="Lineup">
                        {lineup.map((item, index) => (
                            <TrackRow
                                key={`${item.performer.id}-${item.startTime}`}
                                index={index + 1}
                                to={`/performers/${item.performer.id}`}
                                image={item.performer.image}
                                title={item.performer.name}
                                secondary={item.performer.genre}
                                meta={`${formatTime(item.startTime)} – ${formatTime(item.endTime)}`}
                                shape="round"
                            />
                        ))}
                    </TrackList>
                )}
            </section>

            <section className={styles.section}>
                <h2 className={text.sectionTitle}>About</h2>
                <ExpandableText text={event.description} />
                {event.price && (
                    <p className={styles.price}>
                        <Ticket size={16} aria-hidden />
                        {event.price}
                    </p>
                )}
                <SocialLinks links={event.links} className={styles.links} />
            </section>

            {place && moreAtVenue.length > 0 && (
                <Shelf title={`More at ${place.name}`} action={{ to: `/places/${place.id}`, label: "All events" }}>
                    {moreAtVenue.map((other) => (
                        <MediaCard
                            key={other.id}
                            to={`/events/${other.id}`}
                            image={other.image ?? place.image}
                            title={other.title}
                            secondary={calendarDayLabel(other.start)}
                            kind={other.kind}
                        />
                    ))}
                </Shelf>
            )}
        </PageShell>
    );
}
