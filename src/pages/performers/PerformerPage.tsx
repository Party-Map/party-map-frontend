import { Link, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { useLikeStatus, usePerformerPage } from "@/api/hooks";
import { useAuth } from "@/auth/provider";
import { Card, CardBody } from "@/components/Card";
import { CoverImage } from "@/components/CoverImage";
import { SocialLinks } from "@/components/SocialLinks";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import text from "@/components/typography.module.scss";
import { LikeButton } from "@/layout/LikeButton";
import { PageShell } from "@/layout/PageShell";
import { cn } from "@/lib/utils";
import { NotFoundPage } from "@/pages/NotFoundPage";

import styles from "./PerformerPage.module.scss";

/** Public detail page of a performer with the events they play at. */
export function PerformerPage() {
    const { id = "" } = useParams();
    const { status } = useAuth();
    const page = usePerformerPage(id);
    const likeStatus = useLikeStatus("performers", id, { enabled: status === "authenticated" });

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

    const { performer, events } = page.data;

    return (
        <PageShell
            footer={
                <>
                    <h2 className={text.sectionTitle}>Events</h2>
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
                        <h1 className={cn(text.pageTitle, styles.title)}>{performer.name}</h1>
                        {!likeStatus.isLoading && (
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
