import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import { BottomBar } from "./BottomBar";
import styles from "./PageShell.module.scss";
import { TopBar } from "./TopBar";

interface PageShellProps {
    children: ReactNode;
    /** Where the back link points; omit to hide it. */
    backTo?: string | null;
    backLabel?: string;
    /** Extra content rendered under the main block. */
    footer?: ReactNode;
    wide?: boolean;
}

/** Standard page frame: top bar, bottom bar (phones), padded content column with a back link. */
export function PageShell({ children, backTo = "/", backLabel = "Back", footer, wide = false }: PageShellProps) {
    return (
        <>
            <TopBar />
            <BottomBar />
            <main className={cn(styles.main, wide && styles.wide)}>
                {backTo && (
                    <Link to={backTo} className={styles.back}>
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
