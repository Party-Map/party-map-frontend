import { Rocket } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { messageOf } from "@/api/client";
import { usePublishEventPlan } from "@/api/hooks";
import type { EventPlan } from "@/api/types";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/lib/toast";

interface PublishButtonProps {
    plan: EventPlan;
    /** Off until the checklist is complete; the API would refuse anyway. */
    disabled?: boolean;
}

/** Publishes the plan after a confirmation; the live events list opens afterwards. */
export function PublishButton({ plan, disabled = false }: PublishButtonProps) {
    const navigate = useNavigate();
    const publishPlan = usePublishEventPlan(plan.id);
    const [confirming, setConfirming] = useState(false);
    const pending = publishPlan.isPending;

    const publish = async () => {
        setConfirming(false);
        try {
            await publishPlan.mutateAsync();
            toast.success(`${plan.title} is published and on the map.`);
            void navigate("/admin/events/live");
        } catch (error) {
            toast.error(messageOf(error, "Could not publish the event plan. Please try again."));
        }
    };

    return (
        <>
            <Button onClick={() => setConfirming(true)} disabled={disabled || pending}>
                <Rocket size={16} aria-hidden />
                {pending ? "Publishing…" : "Publish"}
            </Button>
            <ConfirmDialog
                open={confirming}
                title={`Publish ${plan.title}?`}
                text="The event goes on the map with its venue and confirmed performers. A published event cannot be edited."
                confirmLabel="Publish"
                onConfirm={() => void publish()}
                onCancel={() => setConfirming(false)}
            />
        </>
    );
}
