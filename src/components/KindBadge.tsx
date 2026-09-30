import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { cx } from "@/lib/cx";
import type { EventType } from "@/lib/types";

import styles from "./KindBadge.module.css";

interface KindBadgeProps {
    kind: EventType;
    size?: "sm" | "md";
    className?: string;
}

/** Coloured pill for an event kind (Disco, Techno, ...). */
export function KindBadge({ kind, size = "md", className }: KindBadgeProps) {
    return (
        <span className={cx(styles.badge, styles[size], className)} data-kind={kind}>
            {EVENT_TYPE_LABELS[kind]}
        </span>
    );
}
