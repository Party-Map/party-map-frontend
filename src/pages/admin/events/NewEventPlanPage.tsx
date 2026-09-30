import { useNavigate } from "react-router";

import { createEventPlan } from "@/api/eventPlans";
import type { EventPlanPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { useToast } from "@/layout/ToastProvider";
import { RequireRole } from "@/pages/admin/RequireRole";

import { EventPlanForm } from "./EventPlanForm";

export function NewEventPlanPage() {
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (payload: EventPlanPayload) => {
        const created = await createEventPlan(payload);
        toast.success("Event plan created.");
        void navigate(`/admin/events/${created.id}`);
    };

    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <EventPlanForm title="Create new Event plan" submitLabel="Create Event plan" onSubmit={handleSubmit} />
        </RequireRole>
    );
}
