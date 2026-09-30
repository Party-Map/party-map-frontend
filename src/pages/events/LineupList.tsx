import { Link } from "react-router";

import type { LineupItem } from "@/api/types";
import { EmptyState } from "@/components/States";
import { formatTime, parseDate } from "@/lib/dates";

import styles from "./LineupList.module.css";

function byStartTime(a: LineupItem, b: LineupItem): number {
    return parseDate(a.startTime).getTime() - parseDate(b.startTime).getTime();
}

/** Set times of an event, earliest first. */
export function LineupList({ items }: { items: LineupItem[] }) {
    const sorted = [...items].sort(byStartTime);

    return (
        <>
            <h2 className="section-title">Lineup &amp; Set Times</h2>
            {sorted.length === 0 ? (
                <EmptyState message="No lineup announced yet." />
            ) : (
                <ul className={styles.list}>
                    {sorted.map((item) => (
                        <li key={`${item.performer.id}-${item.startTime}`} className={styles.item}>
                            <div className={styles.top}>
                                <Link to={`/performers/${item.performer.id}`} className={styles.performer}>
                                    {item.performer.name}
                                </Link>
                                <span className={styles.time}>
                                    {formatTime(item.startTime)} – {formatTime(item.endTime)}
                                </span>
                            </div>
                            <p className={styles.genre}>{item.performer.genre}</p>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
