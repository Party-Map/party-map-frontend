import { ChevronLeft } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router";

import { cn } from "@/lib/utils";

import { BottomBar } from "./BottomBar";
import styles from "./PageShell.module.scss";
import { TopBar } from "./TopBar";

interface PageShellProps {
    children: ReactNode;
    /** Where "Back" leads when the user landed here directly; omit to hide the link. */
    backTo?: string | null;
    backLabel?: string;
    /** Extra content rendered under the main block. */
    footer?: ReactNode;
    wide?: boolean;
}

/** React Router keeps the entry's index in history.state; above zero there is an in-app page to go back to. */
export function hasInAppHistory(): boolean {
    const state: unknown = window.history.state;
    if (typeof state !== "object" || state === null) return false;
    const index = (state as { idx?: unknown }).idx;
    return typeof index === "number" && index > 0;
}

/**
 * Standard page frame: top bar, bottom bar (phones), padded content column with a back link. "Back" returns to the
 * page the user came from (the map, a list, a search), and only to `backTo` when there is none.
 */
export function PageShell({ children, backTo = "/", backLabel = "Back", footer, wide = false }: PageShellProps) {
    const navigate = useNavigate();
    const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
        if (!hasInAppHistory()) return;
        event.preventDefault();
        void navigate(-1);
    };

    return (
        <>
            <TopBar />
            <BottomBar />
            <main className={cn(styles.main, wide && styles.wide)}>
                {backTo && (
                    <Link to={backTo} className={styles.back} onClick={goBack}>
                        <ChevronLeft size={16} aria-hidden />
                        {backLabel}
                    </Link>
                )}
                <div className={styles.content}>{children}</div>
                {footer && <section className={styles.footer}>{footer}</section>}
            </main>
        </>
    );
}
