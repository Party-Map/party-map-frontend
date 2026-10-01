import { useNavigate, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { useEventPlan, useUpdateEventPlan } from "@/api/hooks";
import type { EventPlanPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { EventPlanStepForm } from "./EventPlanStepForm";

/** /admin/events/plans/:id/edit: change a plan's details (any step); saving returns to its workspace. */
export function EditEventPlanPage() {
    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <PlanEditor />
        </RequireRole>
    );
}

function PlanEditor() {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const plan = useEventPlan(id);
    const save = useUpdateEventPlan(id);
    const workspace = `/admin/events/plans/${id}`;

    if (plan.error instanceof ApiError && plan.error.status === 404) return <NotFoundPage />;
    if (plan.isPending) return <LoadingState label="Loading event plan…" />;
    if (!plan.data) return <ErrorState message="Could not load the event plan." onRetry={() => void plan.refetch()} />;

    const submit = async (payload: EventPlanPayload) => {
        await save.mutateAsync(payload);
        toast.success("Event plan saved.");
        void navigate(workspace);
    };

    return (
        <AdminPage
            title={`Edit ${plan.data.title}`}
            breadcrumbs={[
                { label: "Events", to: "/admin/events" },
                { label: "Event plans", to: "/admin/events/plans" },
                { label: plan.data.title, to: workspace },
                { label: "Edit" },
            ]}
        >
            <EventPlanStepForm mode="edit" initial={plan.data} onSubmit={submit} cancelTo={workspace} />
        </AdminPage>
    );
}
