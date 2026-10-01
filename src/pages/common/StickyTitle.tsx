import type { ReactNode } from "react";

import { useInView } from "@/lib/hooks/useInView";
import { cn } from "@/lib/utils";

import styles from "./StickyTitle.module.scss";

/** The sentinel counts as gone once it slides under the fixed top bar. */
const UNDER_TOP_BAR: IntersectionObserverInit = { rootMargin: "-72px 0px 0px 0px" };

interface StickyTitleProps {
    title: string;
    /** One compact action next to the title. */
    action?: ReactNode;
}

/**
 * A condensed title bar that appears under the top bar once the hero has scrolled away. Render it right after the
 * hero: its sentinel marks the hero's bottom edge.
 */
export function StickyTitle({ title, action }: StickyTitleProps) {
    const [ref, inView, supported] = useInView(UNDER_TOP_BAR);
    const visible = supported && inView === false;
    return (
        <>
            <div ref={ref} className={styles.sentinel} aria-hidden />
            <div className={cn(styles.bar, visible && styles.visible)} aria-hidden={!visible}>
                <span className={styles.title}>{title}</span>
                {action && <div className={styles.action}>{action}</div>}
            </div>
        </>
    );
}
