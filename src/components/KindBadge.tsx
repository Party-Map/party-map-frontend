import type { EventType } from "@/api/types";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import styles from "./KindBadge.module.css";

interface KindBadgeProps {
    kind: EventType;
    size?: "sm" | "md";
    className?: string;
}

/** Coloured pill for an event kind (Disco, Techno, ...). */
export function KindBadge({ kind, size = "md", className }: KindBadgeProps) {
    return (
        <span className={cn(styles.badge, styles[size], className)} data-kind={kind}>
            {EVENT_TYPE_LABELS[kind]}
        </span>
    );
}
