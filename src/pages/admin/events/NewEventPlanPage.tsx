import { useNavigate } from "react-router";

import { useCreateEventPlan } from "@/api/hooks";
import type { EventPlanPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

import { EventPlanStepForm } from "./EventPlanStepForm";

/** /admin/events/plans/new: a new plan's details; afterwards its workspace opens for the venue and lineup. */
export function NewEventPlanPage() {
    const navigate = useNavigate();
    const create = useCreateEventPlan();

    const submit = async (payload: EventPlanPayload) => {
        const created = await create.mutateAsync(payload);
        toast.success("Event plan created. Invite a venue and performers next.");
        void navigate(`/admin/events/plans/${created.id}`);
    };

    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <AdminPage
                title="New event plan"
                description="Start with the details; the venue and the lineup come next, in the plan's workspace."
                breadcrumbs={[
                    { label: "Events", to: "/admin/events" },
                    { label: "Event plans", to: "/admin/events/plans" },
                    { label: "New event plan" },
                ]}
            >
                <EventPlanStepForm mode="create" onSubmit={submit} cancelTo="/admin/events/plans" />
            </AdminPage>
        </RequireRole>
    );
}
