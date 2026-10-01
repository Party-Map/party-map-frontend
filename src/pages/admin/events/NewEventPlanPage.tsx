import { useNavigate } from "react-router";

import { useCreateEventPlan } from "@/api/hooks";
import type { EventPlanPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";

import { EventPlanForm } from "./EventPlanForm";

export function NewEventPlanPage() {
    const navigate = useNavigate();
    const create = useCreateEventPlan();

    const handleSubmit = async (payload: EventPlanPayload) => {
        const created = await create.mutateAsync(payload);
        toast.success("Event plan created.");
        void navigate(`/admin/events/plans/${created.id}`);
    };

    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <EventPlanForm title="Create new Event plan" submitLabel="Create Event plan" onSubmit={handleSubmit} />
        </RequireRole>
    );
}
