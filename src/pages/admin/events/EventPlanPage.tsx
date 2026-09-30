import { useNavigate, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { useEventPlan, usePerformers, useUpdateEventPlan } from "@/api/hooks";
import type { EventPlanPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import layout from "@/components/layout.module.scss";
import { ErrorState, LoadingState } from "@/components/States";
import text from "@/components/typography.module.scss";
import { useToast } from "@/layout/ToastProvider";
import { RequireRole } from "@/pages/admin/RequireRole";
import adminStyles from "@/pages/admin/shared/admin.module.scss";
import { InvitationStateLabel } from "@/pages/admin/shared/InvitationStateLabel";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { EventPlanForm } from "./EventPlanForm";
import { InvitePlace } from "./InvitePlace";
import { LineupEditor } from "./LineupEditor";
import { PublishButton } from "./PublishButton";

/** Edit an event plan, invite a place, build the lineup and finally publish it. */
export function EventPlanPage() {
    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <EventPlanDetail />
        </RequireRole>
    );
}

function EventPlanDetail() {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const plan = useEventPlan(id);
    const performers = usePerformers();
    const save = useUpdateEventPlan(id);

    const retry = () => {
        void plan.refetch();
        void performers.refetch();
    };

    const handleSubmit = async (payload: EventPlanPayload) => {
        await save.mutateAsync(payload);
        toast.success("Event plan saved.");
        void navigate("/admin/events");
    };

    if (plan.error instanceof ApiError && plan.error.status === 404) return <NotFoundPage />;
    if (plan.error || performers.error) return <ErrorState message="Could not load the event plan." onRetry={retry} />;
    if (!plan.data || !performers.data) return <LoadingState label="Loading event plan…" />;

    const invitation = plan.data.placeInvitation;

    return (
        <div className={adminStyles.detail}>
            <div>
                <div className={adminStyles.header}>
                    <PublishButton plan={plan.data} />
                </div>
                <EventPlanForm
                    title="Edit event plan"
                    submitLabel="Save changes"
                    initialValues={plan.data}
                    onSubmit={handleSubmit}
                />
            </div>

            <aside className={adminStyles.panel}>
                <section className={layout.stack}>
                    <h2 className={adminStyles.panelTitle}>Place invitation</h2>
                    {invitation && invitation.state !== "REJECTED" ? (
                        <p className={text.muted}>
                            This event plan has been invited to a place ({invitation.place.name}) with a status of{" "}
                            <InvitationStateLabel state={invitation.state} />.
                        </p>
                    ) : (
                        <InvitePlace planId={id} />
                    )}
                </section>

                <LineupEditor plan={plan.data} performers={performers.data} />
            </aside>
        </div>
    );
}
