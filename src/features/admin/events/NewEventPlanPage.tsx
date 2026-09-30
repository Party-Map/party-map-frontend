import { useNavigate } from "react-router";
import { useToast } from "@/app/ToastProvider";
import { createEventPlan } from "@/lib/api/eventPlans";
import { Role } from "@/lib/auth/roles";
import type { EventPlanPayload } from "@/lib/types";
import { RequireRole } from "../RequireRole";
import { EventPlanForm } from "./EventPlanForm";

export function NewEventPlanPage() {
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (payload: EventPlanPayload) => {
        const created = await createEventPlan(payload);
        toast.success("Event plan created.");
        navigate(`/admin/events/${created.id}`);
    };

    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <EventPlanForm title="Create new Event plan" submitLabel="Create Event plan" onSubmit={handleSubmit} />
        </RequireRole>
    );
}
