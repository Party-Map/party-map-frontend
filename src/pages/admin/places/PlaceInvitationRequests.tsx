import { useId, useState } from "react";

import { useRespondToPlaceInvitation } from "@/api/hooks";
import type { ID, PlaceInvitationRequest } from "@/api/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/States";
import { formatDateTimeRange } from "@/lib/format";
import { toast } from "@/lib/toast";
import adminStyles from "@/pages/admin/shared/admin.module.scss";
import { InvitationStateLabel } from "@/pages/admin/shared/InvitationStateLabel";

import styles from "./PlaceInvitationRequests.module.scss";

interface PlaceInvitationRequestsProps {
    placeId: ID;
    requests: PlaceInvitationRequest[];
}

type Answer = "accept" | "reject";

/** Side panel listing the event plans that asked to be hosted at this place. */
export function PlaceInvitationRequests({ placeId, requests }: PlaceInvitationRequestsProps) {
    const answerInvitation = useRespondToPlaceInvitation(placeId);
    const titleId = useId();
    const [busyId, setBusyId] = useState<ID | null>(null);

    const respond = async (request: PlaceInvitationRequest, answer: Answer) => {
        setBusyId(request.eventPlanId);
        try {
            await answerInvitation.mutateAsync({ eventPlanId: request.eventPlanId, answer });
            toast.success(answer === "accept" ? "Invitation accepted." : "Invitation rejected.");
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
