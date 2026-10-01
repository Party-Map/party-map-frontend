import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import styles from "./MediaList.module.scss";

/** The list that MediaRows live in, named for assistive technology ("Events", "Upcoming shows"...). */
export function MediaList({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
    return (
        <ul className={cn(styles.list, className)} aria-label={label}>
            {children}
        </ul>
    );
}
