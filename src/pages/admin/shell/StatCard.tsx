import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import styles from "./StatCard.module.scss";

interface StatCardProps {
    label: string;
    value: ReactNode;
    hint?: string;
    icon: LucideIcon;
    /** Makes the card a link to the list it counts. */
    to?: string;
    /** Highlights a number that needs attention (pending requests). */
    attention?: boolean;
}

/** One number on an overview page, optionally linking to the list behind it. */
export function StatCard({ label, value, hint, icon: Icon, to, attention = false }: StatCardProps) {
    const body = (
        <>
            <span className={styles.top}>
                <span className={styles.label}>{label}</span>
                <Icon size={18} aria-hidden className={styles.icon} />
            </span>
            <span className={styles.value} data-attention={attention || undefined}>
                {value}
            </span>
            {hint && <span className={styles.hint}>{hint}</span>}
        </>
    );
    return to ? (
        <Link to={to} className={styles.card}>
            {body}
        </Link>
    ) : (
        <div className={styles.card}>{body}</div>
    );
}
