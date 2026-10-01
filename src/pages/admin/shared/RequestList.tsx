import { CalendarClock, Check, X } from "lucide-react";
import { type ReactNode, useState } from "react";

import { messageOf } from "@/api/client";
import { Button } from "@/components/Button";
import { formatDateTimeRange } from "@/lib/format";
import { toast } from "@/lib/toast";

import styles from "./RequestList.module.scss";
import type { Answer, InvitationRequest } from "./requests";
import { InvitationStateChip } from "./StatusChip";

interface RequestListProps {
    requests: InvitationRequest[];
    onRespond: (request: InvitationRequest, answer: Answer) => Promise<unknown>;
    /** Names the invited place or performer on each request (when the list spans several). */
    showTarget?: boolean;
    empty: ReactNode;
}

/** Event plans asking a place to host them or a performer to play; each can be accepted or rejected. */
export function RequestList({ requests, onRespond, showTarget = false, empty }: RequestListProps) {
    const [busyKey, setBusyKey] = useState<string | null>(null);

    if (requests.length === 0) return <div className={styles.empty}>{empty}</div>;

    const respond = async (request: InvitationRequest, answer: Answer) => {
        setBusyKey(request.key);
        try {
            await onRespond(request, answer);
            toast.success(answer === "accept" ? "Invitation accepted." : "Invitation rejected.");
        } catch (error) {
            toast.error(messageOf(error, "Could not answer the invitation. Please try again."));
        } finally {
            setBusyKey(null);
        }
    };

    return (
        <ul className={styles.list}>
            {requests.map((request) => {
                const busy = busyKey === request.key;
                return (
                    <li key={request.key} className={styles.item}>
                        <div className={styles.main}>
                            <div className={styles.titleRow}>
                                <h3 className={styles.title}>{request.title}</h3>
                                <InvitationStateChip state={request.state} />
                            </div>
                            <p className={styles.meta}>
                                <CalendarClock size={14} aria-hidden />
                                {formatDateTimeRange(request.start, request.end)}
                            </p>
                            {showTarget && <p className={styles.target}>For {request.targetName}</p>}
                        </div>
                        <div className={styles.actions}>
                            <Button
                                variant="success"
                                size="sm"
                                disabled={busy || request.state === "ACCEPTED"}
                                onClick={() => void respond(request, "accept")}
                                aria-label={`Accept ${request.title}${showTarget ? ` for ${request.targetName}` : ""}`}
                            >
                                <Check size={16} aria-hidden />
                                Accept
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={busy || request.state === "REJECTED"}
                                onClick={() => void respond(request, "reject")}
                                aria-label={`Reject ${request.title}${showTarget ? ` for ${request.targetName}` : ""}`}
                            >
                                <X size={16} aria-hidden />
                                Reject
                            </Button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
