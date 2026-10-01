import { CalendarCheck, ClipboardList, History, Plus } from "lucide-react";
import { Link } from "react-router";

import { useOwnedEventPlans, useOwnedEvents } from "@/api/hooks";
import type { OwnedEventListItem } from "@/api/types";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { formatDateTimeRange } from "@/lib/format";
import { RequireRole } from "@/pages/admin/RequireRole";
import { type Column, DataTable } from "@/pages/admin/shared/DataTable";
import overview from "@/pages/admin/shared/overview.module.scss";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { StatCard } from "@/pages/admin/shell/StatCard";

import { splitByNow } from "./liveEvents";

const NEXT_COLUMNS: Column<OwnedEventListItem>[] = [
    { id: "title", header: "Event", cell: (event) => event.title, primary: true },
    { id: "venue", header: "Venue", cell: (event) => event.placeName },
    { id: "when", header: "When", cell: (event) => formatDateTimeRange(event.start, event.end) },
];

/** /admin/events: the organizer's plans and published events at a glance. */
export function EventsOverviewPage() {
    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <AdminPage
                title="Events"
                description="Plan events, invite a venue and performers, then publish them to the map."
                actions={
                    <ButtonLink to="/admin/events/plans/new">
                        <Plus size={16} aria-hidden />
                        New event plan
                    </ButtonLink>
                }
            >
                <Overview />
            </AdminPage>
        </RequireRole>
    );
}

function Overview() {
    const plans = useOwnedEventPlans();
    const events = useOwnedEvents();

    if (plans.isPending || events.isPending) return <LoadingState />;
    if (!plans.data || !events.data) {
        const retry = () => {
            void plans.refetch();
            void events.refetch();
        };
        return <ErrorState message="Could not load your events." onRetry={retry} />;
    }
    const { upcoming, past } = splitByNow(events.data, new Date());

    return (
        <>
            <div className={overview.stats}>
                <StatCard
                    label="Event plans"
                    value={plans.data.length}
                    icon={ClipboardList}
                    to="/admin/events/plans"
                    hint="Drafts not published yet"
                />
                <StatCard
                    label="Upcoming events"
                    value={upcoming.length}
                    icon={CalendarCheck}
                    to="/admin/events/live"
                />
                <StatCard label="Past events" value={past.length} icon={History} to="/admin/events/live" />
            </div>
            <section className={overview.section} aria-labelledby="events-next">
                <div className={overview.sectionHead}>
                    <h2 id="events-next" className={overview.sectionTitle}>
                        Coming up
                    </h2>
                    <Link to="/admin/events/live" className={overview.sectionLink}>
                        All live events
                    </Link>
                </div>
                <DataTable
                    caption="Your next events"
                    columns={NEXT_COLUMNS}
                    rows={upcoming.slice(0, 5)}
                    rowKey={(event) => event.id}
                    rowTo={(event) => `/events/${event.id}`}
                    empty="No upcoming events. Publish an event plan to see it here."
                />
            </section>
        </>
    );
}
