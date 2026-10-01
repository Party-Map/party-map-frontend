import { useOwnedEvents } from "@/api/hooks";
import type { OwnedEventListItem } from "@/api/types";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { formatDateTimeRange } from "@/lib/format";
import { RequireRole } from "@/pages/admin/RequireRole";
import { type Column, DataTable } from "@/pages/admin/shared/DataTable";
import overview from "@/pages/admin/shared/overview.module.scss";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

import { splitByNow } from "./liveEvents";

const COLUMNS: Column<OwnedEventListItem>[] = [
    { id: "title", header: "Event", cell: (event) => event.title, primary: true },
    { id: "venue", header: "Venue", cell: (event) => event.placeName },
    { id: "when", header: "When", cell: (event) => formatDateTimeRange(event.start, event.end) },
];

/** /admin/events/live: the organizer's published events; each row opens its public page. */
export function LiveEventsPage() {
    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <AdminPage
                title="Live events"
                description="Published events are on the map and can no longer be edited."
                breadcrumbs={[{ label: "Events", to: "/admin/events" }, { label: "Live events" }]}
            >
                <Events />
            </AdminPage>
        </RequireRole>
    );
}

function Events() {
    const { data, isPending, refetch } = useOwnedEvents();
    if (isPending) return <LoadingState />;
    if (!data) return <ErrorState message="Could not load your events." onRetry={() => void refetch()} />;
    const { upcoming, past } = splitByNow(data, new Date());
    return (
        <>
            <section className={overview.section} aria-labelledby="live-upcoming">
                <h2 id="live-upcoming" className={overview.sectionTitle}>
                    Upcoming ({upcoming.length})
                </h2>
                <DataTable
                    caption="Upcoming events"
                    columns={COLUMNS}
                    rows={upcoming}
                    rowKey={(event) => event.id}
                    rowTo={(event) => `/events/${event.id}`}
                    external
                    empty="No upcoming events."
                />
            </section>
            <section className={overview.section} aria-labelledby="live-past">
                <h2 id="live-past" className={overview.sectionTitle}>
                    Past ({past.length})
                </h2>
                <DataTable
                    caption="Past events"
                    columns={COLUMNS}
                    rows={past}
                    rowKey={(event) => event.id}
                    rowTo={(event) => `/events/${event.id}`}
                    external
                    empty="No past events."
                />
            </section>
        </>
    );
}
