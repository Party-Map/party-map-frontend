import type { ReactNode } from "react";

import type { InvitationState } from "@/api/types";

import styles from "./StatusChip.module.scss";

export type ChipTone = "neutral" | "success" | "danger" | "warning" | "info";

const TONES: Record<ChipTone, string | undefined> = {
    neutral: styles.neutral,
    success: styles.success,
    danger: styles.danger,
    warning: styles.warning,
    info: styles.info,
};

/** A small coloured label for a state (accepted, pending, disabled...). */
export function StatusChip({ tone = "neutral", children }: { tone?: ChipTone; children: ReactNode }) {
    return <span className={`${styles.chip} ${TONES[tone] ?? ""}`}>{children}</span>;
}

const INVITATION: Record<InvitationState, { tone: ChipTone; label: string }> = {
    PENDING: { tone: "warning", label: "Pending" },
    ACCEPTED: { tone: "success", label: "Accepted" },
    REJECTED: { tone: "danger", label: "Rejected" },
};

export function InvitationStateChip({ state }: { state: InvitationState }) {
    const { tone, label } = INVITATION[state];
    return <StatusChip tone={tone}>{label}</StatusChip>;
}
