import { useState } from "react";
import { useNavigate } from "react-router";

import { publishEventPlan } from "@/api/eventPlans";
import type { EventPlan } from "@/api/types";
import { Button } from "@/components/Button";
import { useToast } from "@/layout/ToastProvider";

/** Publishes the plan after a confirmation; on success the map opens focused on the accepted place. */
export function PublishButton({ plan }: { plan: EventPlan }) {
    const navigate = useNavigate();
    const toast = useToast();
    const [pending, setPending] = useState(false);

    const publish = async () => {
        const confirmed = await toast.confirm({
            title: "Publish event?",
            text: "Once published, this cannot be undone. Continue?",
            confirmLabel: "Yes, publish",
        });
        if (!confirmed) return;

        setPending(true);
        try {
            await publishEventPlan(plan.id);
            toast.success("Event plan published successfully!");
            const placeId = plan.placeInvitation?.place.id;
            void navigate(placeId ? `/?focus=${encodeURIComponent(placeId)}` : "/");
        } catch {
            toast.error(
                "Failed to publish event plan. Check if the place accepted the invitation and there are no pending performer invitations!",
            );
        } finally {
            setPending(false);
        }
    };

    return (
        <Button onClick={publish} disabled={pending}>
            {pending ? "Publishing…" : "Publish event"}
        </Button>
    );
}
