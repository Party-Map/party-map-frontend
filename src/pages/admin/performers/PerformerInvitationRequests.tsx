import { useId, useState } from "react";

import { useRespondToPerformerInvitation } from "@/api/hooks";
import type { ID, PerformerInvitationRequest } from "@/api/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/States";
import { useToast } from "@/layout/ToastProvider";
import { formatDateTimeRange } from "@/lib/dates";
import adminStyles from "@/pages/admin/shared/admin.module.scss";
import { InvitationStateLabel } from "@/pages/admin/shared/InvitationStateLabel";

import styles from "./PerformerInvitationRequests.module.scss";

interface PerformerInvitationRequestsProps {
    performerId: ID;
    requests: PerformerInvitationRequest[];
}

type Answer = "accept" | "reject";

/** Side panel listing the event plans that asked this performer to play. */
export function PerformerInvitationRequests({ performerId, requests }: PerformerInvitationRequestsProps) {
    const toast = useToast();
    const answerInvitation = useRespondToPerformerInvitation(performerId);
    const titleId = useId();
    const [busyId, setBusyId] = useState<ID | null>(null);

    const respond = async (request: PerformerInvitationRequest, answer: Answer) => {
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

            {requests.length === 0 && <EmptyState message="No event requests at the moment for this performer." />}

            {requests.map((request) => {
                const busy = busyId === request.eventPlanId;
                return (
                    <Card key={request.eventPlanId} className={adminStyles.requestCard}>
                        <div className={adminStyles.requestTitleRow}>
                            <h3 className={adminStyles.requestTitle}>{request.eventPlanTitle}</h3>
                            <InvitationStateLabel state={request.state} />
                        </div>
                        <p className={styles.text}>{formatDateTimeRange(request.startTime, request.endTime)}</p>
                        <p className={styles.text}>
                            An event organizer has invited this performer to play at an event. You can accept or reject
                            the invitation.
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
