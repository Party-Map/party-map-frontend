import type { InvitationState } from "@/api/types";

import styles from "./admin.module.scss";

const LABELS: Record<InvitationState, { text: string; className: string | undefined }> = {
    ACCEPTED: { text: "Accepted", className: styles.stateAccepted },
    REJECTED: { text: "Rejected", className: styles.stateRejected },
    PENDING: { text: "Pending", className: styles.statePending },
};

export function InvitationStateLabel({ state }: { state: InvitationState }) {
    const { text, className } = LABELS[state];
    return <span className={className}>{text}</span>;
}
