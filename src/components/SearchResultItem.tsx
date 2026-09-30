import { CalendarDays, MapPin, UserRound } from "lucide-react";

import { CoverImage } from "@/components/CoverImage";
import { cx } from "@/lib/cx";
import { formatNextEventStart } from "@/lib/dates";
import type { SearchHit, SearchHitType } from "@/lib/types";

import styles from "./SearchBar.module.css";

const TYPE_META: Record<SearchHitType, { label: string; Icon: typeof MapPin; className: string | undefined }> = {
    PLACE: { label: "Place", Icon: MapPin, className: styles.typePlace },
    EVENT: { label: "Event", Icon: CalendarDays, className: styles.typeEvent },
    PERFORMER: { label: "Performer", Icon: UserRound, className: styles.typePerformer },
};

export function SearchResultItem({ hit, onPick, onView }: { hit: SearchHit; onPick: () => void; onView: () => void }) {
    const { label, Icon, className: typeClass } = TYPE_META[hit.type];
    const dateLabel = formatNextEventStart(hit.nextEventStart);

    return (
        <li className={styles.item}>
            <button type="button" onClick={onPick} className={styles.itemMain}>
                <span className={styles.thumb}>
                    <CoverImage src={hit.image} alt="" height="sm" className={styles.thumbImage} />
                    <span className={styles.thumbLetter}>{hit.type.charAt(0)}</span>
                </span>
                <span className={styles.itemText}>
                    <span className={styles.itemTitleRow}>
                        <span className={styles.itemTitle}>{hit.title}</span>
                        <span className={cx(styles.typePill, typeClass)}>
                            <Icon size={12} aria-hidden />
                            {label}
                        </span>
                    </span>
                    <span className={styles.itemSubtitle}>{hit.subtitle}</span>
                </span>
                {dateLabel && <span className={styles.itemDate}>{dateLabel}</span>}
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onView();
                }}
                className={styles.viewButton}
            >
                View
            </button>
        </li>
    );
}
