import type { ReactNode } from "react";
import { Link } from "react-router";

import styles from "./Shelf.module.scss";

interface ShelfProps {
    title: string;
    /** A "see all" link on the right of the title. */
    action?: { to: string; label: string };
    /** MediaCards. */
    children: ReactNode;
}

/** A titled row of cards that scrolls sideways, snapping card by card. */
export function Shelf({ title, action, children }: ShelfProps) {
    return (
        <section className={styles.shelf}>
            <div className={styles.head}>
                <h2 className={styles.title}>{title}</h2>
                {action && (
                    <Link to={action.to} className={styles.action}>
                        {action.label} ›
                    </Link>
                )}
            </div>
            <ul className={styles.track} aria-label={title}>
                {children}
            </ul>
        </section>
    );
}
