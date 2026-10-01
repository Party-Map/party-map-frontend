import type { ReactNode } from "react";
import { Link } from "react-router";

import type { EventType } from "@/api/types";
import { KindBadge } from "@/components/KindBadge";

import { Artwork } from "./Artwork";
import styles from "./MediaCard.module.scss";

interface MediaCardProps {
    to: string;
    image?: string | null;
    title: string;
    secondary?: ReactNode;
    kind?: EventType;
}

/** A square card for the shelves: artwork with the kind in its corner, a title and one line of detail. */
export function MediaCard({ to, image, title, secondary, kind }: MediaCardProps) {
    return (
        <li className={styles.card}>
            <Link to={to} className={styles.link}>
                <span className={styles.art}>
                    <Artwork src={image} alt="" size="card" ambient />
                    {kind && <KindBadge kind={kind} size="sm" className={styles.kind} />}
                </span>
                <span className={styles.title}>{title}</span>
                {secondary && <span className={styles.secondary}>{secondary}</span>}
            </Link>
        </li>
    );
}
