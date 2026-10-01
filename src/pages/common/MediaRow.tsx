import type { ReactNode } from "react";
import { Link } from "react-router";

import type { EventType } from "@/api/types";
import { KindBadge } from "@/components/KindBadge";

import { Artwork } from "./Artwork";
import styles from "./MediaRow.module.scss";

interface MediaRowProps {
    to: string;
    image?: string | null;
    title: string;
    /** The line under the title (venue, city, genre...). */
    secondary?: ReactNode;
    /** The small line at the bottom (time, distance, tags...). */
    meta?: ReactNode;
    kind?: EventType;
    shape?: "square" | "round";
    /** Rendered after the link, outside it (a like button, for instance). */
    trailing?: ReactNode;
}

/** A track-list style row: artwork, title and two lines of detail, the whole row a link. */
export function MediaRow({ to, image, title, secondary, meta, kind, shape = "square", trailing }: MediaRowProps) {
    return (
        <li className={styles.row}>
            <Link to={to} className={styles.link}>
                <Artwork src={image} alt="" size="row" shape={shape} ambient />
                <span className={styles.text}>
                    <span className={styles.title}>{title}</span>
                    {secondary && <span className={styles.secondary}>{secondary}</span>}
                    {meta && <span className={styles.meta}>{meta}</span>}
                </span>
                {kind && <KindBadge kind={kind} size="sm" className={styles.kind} />}
            </Link>
            {trailing && <div className={styles.trailing}>{trailing}</div>}
        </li>
    );
}
