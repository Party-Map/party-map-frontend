import { Plus } from "lucide-react";

import { useOwnedEventPlans } from "@/api/hooks";
import type { EventPlanListItem } from "@/api/types";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { formatDateTimeRange } from "@/lib/format";
import { RequireRole } from "@/pages/admin/RequireRole";
import { type Column, DataTable } from "@/pages/admin/shared/DataTable";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

const COLUMNS: Column<EventPlanListItem>[] = [
    { id: "title", header: "Title", cell: (plan) => plan.title, primary: true },
    { id: "when", header: "When", cell: (plan) => formatDateTimeRange(plan.startDateTime, plan.endDateTime) },
];

/** /admin/events/plans: the organizer's drafts; each opens its workspace (venue, lineup, publishing). */
export function EventPlansPage() {
    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <AdminPage
                title="Event plans"
                description="Drafts you are still organizing. Publishing a plan puts it on the map."
                breadcrumbs={[{ label: "Events", to: "/admin/events" }, { label: "Event plans" }]}
                actions={
                    <ButtonLink to="/admin/events/plans/new">
                        <Plus size={16} aria-hidden />
                        New event plan
                    </ButtonLink>
                }
            >
                <PlansTable />
            </AdminPage>
        </RequireRole>
    );
}

function PlansTable() {
    const { data, isPending, refetch } = useOwnedEventPlans();
    if (isPending) return <LoadingState />;
    if (!data) return <ErrorState message="Could not load your event plans." onRetry={() => void refetch()} />;
    return (
        <DataTable
            caption="Your event plans"
            columns={COLUMNS}
            rows={data.toSorted((a, b) => a.startDateTime.localeCompare(b.startDateTime))}
            rowKey={(plan) => plan.id}
            rowTo={(plan) => `/admin/events/plans/${plan.id}`}
            empty="You have no event plans yet. Start one to organize your next event."
        />
    );
}
