import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import { useLikeStatus, usePlacePage } from "@/api/hooks";
import { useAuth } from "@/auth/provider";
import { ChipLink } from "@/components/Chip";
import { ExpandableText } from "@/components/ExpandableText";
import { SocialLinks } from "@/components/SocialLinks";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import text from "@/components/typography.module.scss";
import { LikeButton } from "@/layout/LikeButton";
import { PageShell } from "@/layout/PageShell";
import { splitByNow } from "@/lib/eventTime";
import { formatDateTimeRange } from "@/lib/format";
import { pageTitle, usePageMeta } from "@/lib/seo";
import { Hero } from "@/pages/common/Hero";
import { MediaList } from "@/pages/common/MediaList";
import { MediaRow } from "@/pages/common/MediaRow";
import { DirectionsPill, MapPill, SharePill } from "@/pages/common/pageActions";
import { StickyTitle } from "@/pages/common/StickyTitle";
import { NotFoundPage } from "@/pages/NotFoundPage";

import styles from "./PlacePage.module.scss";

/** Public detail page of a place: hero, upcoming and past events, about. */
export function PlacePage() {
    const { id = "" } = useParams();
    const { status } = useAuth();
    const page = usePlacePage(id);
    const likeStatus = useLikeStatus("places", id, { enabled: status === "authenticated" });
    usePageMeta(
        page.data
            ? {
                  title: pageTitle(page.data.place.name),
                  description: page.data.place.description ?? `${page.data.place.address}, ${page.data.place.city}`,
                  canonicalPath: `/places/${id}`,
                  image: page.data.place.image,
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
                <ErrorState message="Could not load this place." onRetry={() => void page.refetch()} />
            </PageShell>
        );
    }

    const { place, events } = page.data;
    const { upcoming, past } = splitByNow(events, new Date());
    const row = (event: (typeof events)[number]) => (
        <MediaRow
            key={event.id}
            to={`/events/${event.id}`}
            image={event.image ?? place.image}
            title={event.title}
            secondary={<time dateTime={event.start}>{formatDateTimeRange(event.start, event.end)}</time>}
            meta={event.price ?? undefined}
            kind={event.kind}
        />
    );

    return (
        <PageShell backTo="/browse/places">
            <Hero
                image={place.image}
                alt={place.name}
                eyebrow={place.city}
                title={place.name}
                subtitle={
                    <address>
                        {place.address}, {place.city}
                    </address>
                }
                actions={
                    <>
                        <MapPill placeId={place.id} />
                        <DirectionsPill point={place.location} />
                        {!likeStatus.isLoading && (
                            <LikeButton
                                target="places"
                                targetId={id}
                                targetName={place.name}
                                initialLiked={likeStatus.data?.liked ?? false}
                            />
                        )}
                        <SharePill title={place.name} />
                    </>
                }
            />
            <StickyTitle title={place.name} action={<MapPill placeId={place.id} />} />

            <section className={styles.section}>
                <h2 className={text.sectionTitle}>Upcoming events</h2>
                {upcoming.length === 0 ? (
                    <EmptyState message="No events yet." />
                ) : (
                    <MediaList label="Upcoming events">{upcoming.map(row)}</MediaList>
                )}
                {past.length > 0 && (
                    <details className={styles.past}>
                        <summary className={styles.summary}>Past events ({past.length})</summary>
                        <MediaList label="Past events">{past.map(row)}</MediaList>
                    </details>
                )}
            </section>

            <section className={styles.section}>
                <h2 className={text.sectionTitle}>About</h2>
                {place.description && <ExpandableText text={place.description} />}
                {place.tags.length > 0 && (
                    <ul className={styles.tags} aria-label="Tags">
                        {place.tags.map((tag) => (
                            <li key={tag}>
                                <ChipLink to={`/browse/places?tag=${encodeURIComponent(tag)}`}>{tag}</ChipLink>
                            </li>
                        ))}
                    </ul>
                )}
                <SocialLinks links={place.links} className={styles.links} />
            </section>
        </PageShell>
    );
}
