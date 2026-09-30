import { Link, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { useEventPage, useLikeStatus } from "@/api/hooks";
import { useAuth } from "@/auth/provider";
import { Card, CardBody } from "@/components/Card";
import { CoverImage } from "@/components/CoverImage";
import { SocialLinks } from "@/components/SocialLinks";
import { ErrorState, LoadingState } from "@/components/States";
import text from "@/components/typography.module.scss";
import { LikeButton } from "@/layout/LikeButton";
import { PageShell } from "@/layout/PageShell";
import { formatDateTimeRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { NotFoundPage } from "@/pages/NotFoundPage";

import styles from "./EventPage.module.scss";
import { LineupList } from "./LineupList";

/** Public detail page of an event with its lineup. */
export function EventPage() {
    const { id = "" } = useParams();
    const { status } = useAuth();
    const page = useEventPage(id);
    const likeStatus = useLikeStatus("events", id, { enabled: status === "authenticated" });

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

    return (
        <PageShell footer={<LineupList items={event.lineupItems} />}>
            <Card>
                <CoverImage src={event.image} alt={event.title} />
                <CardBody>
                    <div className={styles.titleRow}>
                        <h1 className={cn(text.pageTitle, styles.title)}>{event.title}</h1>
                        {!likeStatus.isLoading && (
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
                            <Link to={`/places/${place.id}`} className={text.link}>
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
