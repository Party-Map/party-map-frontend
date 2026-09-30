import { useId, useState } from "react";
import { useToast } from "@/app/ToastProvider";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/States";
import { InvitationStateLabel } from "@/features/admin/InvitationStateLabel";
import { respondToPlaceInvitation } from "@/lib/api/places";
import { formatDateTimeRange } from "@/lib/dates";
import type { ID, PlaceInvitationRequest } from "@/lib/types";
import adminStyles from "@/features/admin/admin.module.css";
import styles from "./PlaceInvitationRequests.module.css";

type PlaceInvitationRequestsProps = {
    placeId: ID;
    requests: PlaceInvitationRequest[];
    /** Called after an answer was saved so the owner can reload the list. */
    onChanged: () => void;
};

type Answer = "accept" | "reject";

/** Side panel listing the event plans that asked to be hosted at this place. */
export function PlaceInvitationRequests({ placeId, requests, onChanged }: PlaceInvitationRequestsProps) {
    const toast = useToast();
    const titleId = useId();
    const [busyId, setBusyId] = useState<ID | null>(null);

    const respond = async (request: PlaceInvitationRequest, answer: Answer) => {
        setBusyId(request.eventPlanId);
        try {
            await respondToPlaceInvitation(placeId, request.eventPlanId, answer);
            toast.success(answer === "accept" ? "Invitation accepted." : "Invitation rejected.");
            onChanged();
        } catch {
            toast.error("Could not answer the invitation. Please try again.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <aside className={adminStyles.panel} aria-labelledby={titleId}>
            <h2 id={titleId} className={adminStyles.panelTitle}>
                Event requests
            </h2>

            {requests.length === 0 && <EmptyState message="No event requests at the moment for this place." />}

            {requests.map((request) => {
                const busy = busyId === request.eventPlanId;
                return (
                    <Card key={request.eventPlanId} className={adminStyles.requestCard}>
                        <div className={adminStyles.requestTitleRow}>
                            <h3 className={adminStyles.requestTitle}>{request.title}</h3>
                            <InvitationStateLabel state={request.state} />
                        </div>
                        <p className={styles.text}>{formatDateTimeRange(request.startDateTime, request.endDateTime)}</p>
                        <p className={styles.text}>
                            An event organizer has invited this place to host an event. You can accept or reject the
                            invitation.
                        </p>
                        <div className={adminStyles.requestActions}>
                            <Button
                                variant="success"
                                size="sm"
                                disabled={busy || request.state === "ACCEPTED"}
                                onClick={() => respond(request, "accept")}
                            >
                                Accept
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                disabled={busy || request.state === "REJECTED"}
                                onClick={() => respond(request, "reject")}
                            >
                                Reject
                            </Button>
                        </div>
                    </Card>
                );
            })}
        </aside>
    );
}
