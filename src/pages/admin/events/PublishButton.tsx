import { useState } from "react";
import { useNavigate } from "react-router";

import { usePublishEventPlan } from "@/api/hooks";
import type { EventPlan } from "@/api/types";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/lib/toast";

/** Publishes the plan after a confirmation; on success the map opens focused on the accepted place. */
export function PublishButton({ plan }: { plan: EventPlan }) {
    const navigate = useNavigate();
    const publishPlan = usePublishEventPlan(plan.id);
    const [confirming, setConfirming] = useState(false);
    const pending = publishPlan.isPending;

    const publish = async () => {
        setConfirming(false);
        try {
            await publishPlan.mutateAsync();
            toast.success("Event plan published successfully!");
            const placeId = plan.placeInvitation?.place.id;
            void navigate(placeId ? `/?focus=${encodeURIComponent(placeId)}` : "/");
        } catch {
            toast.error(
                "Failed to publish event plan. Check if the place accepted the invitation and there are no pending performer invitations!",
            );
        }
    };

    return (
        <>
            <Button onClick={() => setConfirming(true)} disabled={pending}>
                {pending ? "Publishing…" : "Publish event"}
            </Button>
            <ConfirmDialog
                open={confirming}
                title="Publish event?"
                text="Once published, this cannot be undone. Continue?"
                confirmLabel="Yes, publish"
                onConfirm={() => void publish()}
                onCancel={() => setConfirming(false)}
            />
        </>
    );
}
