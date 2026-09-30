import { useState } from "react";
import { Link } from "react-router";

import { CoverImage } from "@/components/CoverImage";
import { KindBadge } from "@/components/KindBadge";
import { LikeButton } from "@/components/LikeButton";
import type { EventType, ID, LikeTarget } from "@/lib/types";

import styles from "./LikedListItem.module.css";

interface LikedListItemProps {
    target: LikeTarget;
    id: ID;
    to: string;
    title: string;
    image?: string | null;
    secondary?: string;
    meta?: string;
    kind?: EventType;
}

/** Row of a liked item with its own heart toggle; unliking removes the row. */
export function LikedListItem({ target, id, to, title, image, secondary, meta, kind }: LikedListItemProps) {
    const [liked, setLiked] = useState(true);

    if (!liked) return null;

    return (
        <li className={styles.item}>
            <CoverImage src={image} alt="" height="sm" />
            <div className={styles.body}>
                <div className={styles.top}>
                    <div className={styles.text}>
                        <Link to={to} className={styles.title}>
                            {title}
                        </Link>
                        {secondary && <p className={styles.secondary}>{secondary}</p>}
                    </div>
                    <LikeButton target={target} targetId={id} targetName={title} initialLiked onChange={setLiked} />
                </div>
                {(meta || kind) && (
                    <div className={styles.meta}>
                        {meta && <p>{meta}</p>}
                        {kind && <KindBadge kind={kind} size="sm" />}
                    </div>
                )}
            </div>
        </li>
    );
}
