import { Link, useParams } from "react-router";
import { Card, CardBody } from "@/components/Card";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/components/LikeButton";
import { PageShell } from "@/components/PageShell";
import { SocialLinks } from "@/components/SocialLinks";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { ApiError } from "@/lib/api/client";
import { fetchEventsByPerformer } from "@/lib/api/events";
import { fetchLikeStatus } from "@/lib/api/likes";
import { fetchPerformer } from "@/lib/api/performers";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cx } from "@/lib/cx";
import { useResource } from "@/lib/hooks/useResource";
import type { Event, ID, Performer } from "@/lib/types";
import { NotFoundPage } from "@/pages/NotFoundPage";
import styles from "./PerformerPage.module.css";

type PerformerPageData = { performer: Performer; events: Event[] };

async function loadPerformerPage(id: ID): Promise<PerformerPageData> {
    const [performer, events] = await Promise.all([fetchPerformer(id), fetchEventsByPerformer(id)]);
    return { performer, events };
}

/** Public detail page of a performer with the events they play at. */
export function PerformerPage() {
    const { id = "" } = useParams();
    const { status } = useAuth();
    const page = useResource(() => loadPerformerPage(id), [id]);
    const likeStatus = useResource(() => fetchLikeStatus("performers", id), [id], {
        enabled: status === "authenticated",
    });

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
                <ErrorState message="Could not load this performer." onRetry={page.reload} />
            </PageShell>
        );
    }

    const { performer, events } = page.data;

    return (
        <PageShell
            footer={
                <>
                    <h2 className="section-title">Events</h2>
                    {events.length === 0 ? (
                        <EmptyState message="No events yet." />
                    ) : (
                        <ul className={styles.events}>
                            {events.map((event) => (
                                <li key={event.id}>
                                    <Card padded>
                                        <Link to={`/events/${event.id}`} className={styles.eventLink}>
                                            {event.title}
                                        </Link>
                                    </Card>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            }
        >
            <Card>
                <CoverImage src={performer.image} alt={performer.name} />
                <CardBody>
                    <div className={styles.titleRow}>
                        <h1 className={cx("page-title", styles.title)}>{performer.name}</h1>
                        {!likeStatus.loading && (
                            <LikeButton
                                target="performers"
                                targetId={id}
                                targetName={performer.name}
                                initialLiked={likeStatus.data?.liked ?? false}
                            />
                        )}
                    </div>
                    <p className={styles.metaLine}>{performer.genre}</p>
                    <p className={styles.bio}>{performer.bio}</p>
                    <SocialLinks links={performer.links} className={styles.links} />
                </CardBody>
            </Card>
        </PageShell>
    );
}
