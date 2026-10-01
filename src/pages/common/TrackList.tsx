import type { ReactNode } from "react";
import { Link } from "react-router";

import { Artwork } from "./Artwork";
import styles from "./TrackList.module.scss";

/** Numbered rows, like an album's track list: the lineup of an event, the shows of a performer. */
export function TrackList({ label, children }: { label: string; children: ReactNode }) {
    return (
        <ol className={styles.list} aria-label={label}>
            {children}
        </ol>
    );
}

interface TrackRowProps {
    index: number;
    to: string;
    image?: string | null;
    title: string;
    secondary?: ReactNode;
    /** The right-aligned detail (a time span, a date). */
    meta?: ReactNode;
    shape?: "square" | "round";
}

export function TrackRow({ index, to, image, title, secondary, meta, shape = "square" }: TrackRowProps) {
    return (
        <li className={styles.row}>
            <Link to={to} className={styles.link}>
                <span className={styles.index}>{index}</span>
                <Artwork src={image} alt="" size="row" shape={shape} ambient />
                <span className={styles.text}>
                    <span className={styles.title}>{title}</span>
                    {secondary && <span className={styles.secondary}>{secondary}</span>}
                </span>
                {meta && <span className={styles.meta}>{meta}</span>}
            </Link>
        </li>
    );
}
