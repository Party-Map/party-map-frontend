import { useOwnedEventPlans, useOwnedEvents } from "@/api/hooks";
import type { OwnedEventListItem } from "@/api/types";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import text from "@/components/typography.module.scss";
import { formatDateTimeRange, parseDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { RequireRole } from "@/pages/admin/RequireRole";
import adminStyles from "@/pages/admin/shared/admin.module.scss";
import { AdminListItem } from "@/pages/admin/shared/AdminListItem";

import styles from "./AdminEventsPage.module.scss";

/** Event plans on the left, published events (upcoming, then past behind a toggle) on the right. */
export function AdminEventsPage() {
    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <EventsOverview />
        </RequireRole>
    );
}

function splitByNow(events: OwnedEventListItem[], now: Date) {
    return {
        upcoming: events.filter((e) => parseDate(e.end) >= now),
        past: events.filter((e) => parseDate(e.end) < now),
    };
}

function EventRow({ event }: { event: OwnedEventListItem }) {
    return (
        <AdminListItem
            title={event.title}
            lines={[formatDateTimeRange(event.start, event.end), event.placeName]}
            to={`/events/${event.id}`}
        />
    );
}

function EventsOverview() {
    const plans = useOwnedEventPlans();
    const events = useOwnedEvents();
    const live = events.data ? splitByNow(events.data, new Date()) : null;

    return (
        <div className={styles.columns}>
            <section className={styles.column}>
                <div className={adminStyles.header}>
                    <h1 className={text.pageTitle}>Event planning</h1>
                    <ButtonLink to="/admin/events/new">Add a new Event Plan</ButtonLink>
                </div>

                {plans.isPending && <LoadingState label="Loading event plans…" />}
                {plans.error && (
                    <ErrorState message="Could not load your event plans." onRetry={() => void plans.refetch()} />
                )}
                {plans.data &&
                    (plans.data.length === 0 ? (
                        <EmptyState message="You have no event plans yet." />
                    ) : (
                        <ul className={adminStyles.list}>
                            {plans.data.map((plan) => (
                                <AdminListItem
                                    key={plan.id}
                                    title={plan.title}
                                    lines={[formatDateTimeRange(plan.startDateTime, plan.endDateTime)]}
                                    to={`/admin/events/${plan.id}`}
                                />
                            ))}
                        </ul>
                    ))}
            </section>

            <section className={styles.column}>
                <div className={adminStyles.header}>
                    <h1 className={text.pageTitle}>Your live events</h1>
                </div>

                {events.isPending && <LoadingState label="Loading your events…" />}
                {events.error && (
                    <ErrorState message="Could not load your events." onRetry={() => void events.refetch()} />
                )}
                {live && (
                    <>
                        {live.upcoming.length === 0 ? (
                            <EmptyState message="You have no live events." />
                        ) : (
                            <ul className={adminStyles.list}>
                                {live.upcoming.map((event) => (
                                    <EventRow key={event.id} event={event} />
                                ))}
                            </ul>
                        )}

                        <details className={styles.past}>
                            <summary className={styles.summary}>Past events ({live.past.length})</summary>
                            {live.past.length === 0 ? (
                                <EmptyState message="You have no past events." />
                            ) : (
                                <ul className={cn(adminStyles.list, styles.pastList)}>
                                    {live.past.map((event) => (
                                        <EventRow key={event.id} event={event} />
                                    ))}
                                </ul>
                            )}
                        </details>
                    </>
                )}
            </section>
        </div>
    );
}
