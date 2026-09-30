import { ButtonLink } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { fetchOwnedEventPlans } from "@/lib/api/eventPlans";
import { fetchOwnedEvents } from "@/lib/api/events";
import { Role } from "@/lib/auth/roles";
import { cx } from "@/lib/cx";
import { formatDateTimeRange, parseDate } from "@/lib/dates";
import { useResource } from "@/lib/hooks/useResource";
import type { OwnedEventListItem } from "@/lib/types";

import adminStyles from "../admin.module.css";
import { AdminListItem } from "../AdminListItem";
import { RequireRole } from "../RequireRole";
import styles from "./AdminEventsPage.module.css";

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
    const plans = useResource(fetchOwnedEventPlans, []);
    const events = useResource(fetchOwnedEvents, []);
    const live = events.data ? splitByNow(events.data, new Date()) : null;

    return (
        <div className={styles.columns}>
            <section className={styles.column}>
                <div className={adminStyles.header}>
                    <h1 className="page-title">Event planning</h1>
                    <ButtonLink to="/admin/events/new">Add a new Event Plan</ButtonLink>
                </div>

                {plans.loading && <LoadingState label="Loading event plans…" />}
                {plans.error && <ErrorState message="Could not load your event plans." onRetry={plans.reload} />}
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
                    <h1 className="page-title">Your live events</h1>
                </div>

                {events.loading && <LoadingState label="Loading your events…" />}
                {events.error && <ErrorState message="Could not load your events." onRetry={events.reload} />}
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
                                <ul className={cx(adminStyles.list, styles.pastList)}>
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
