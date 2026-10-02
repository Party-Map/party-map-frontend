// One search hit in the dropdown: a cmdk option (Enter or a click focuses its place on the map) with a View button
// that opens the hit's own page. The type shows as a coloured icon on the thumbnail's corner (named for screen
// readers), so the title gets the whole line.
import { Command } from "cmdk";
import { CalendarDays, ChevronRight, MapPin, UserRound } from "lucide-react";

import type { SearchHit, SearchHitType } from "@/api/types";
import { CoverImage } from "@/components/CoverImage";
import { formatNextEventStart } from "@/lib/format";
import { cn } from "@/lib/utils";

import styles from "./SearchBar.module.scss";

const TYPE_META: Record<SearchHitType, { label: string; Icon: typeof MapPin; className: string | undefined }> = {
    PLACE: { label: "Place", Icon: MapPin, className: styles.typePlace },
    EVENT: { label: "Event", Icon: CalendarDays, className: styles.typeEvent },
    PERFORMER: { label: "Performer", Icon: UserRound, className: styles.typePerformer },
};

interface SearchResultItemProps {
    hit: SearchHit;
    onPick: () => void;
    onView: () => void;
}

export function SearchResultItem({ hit, onPick, onView }: SearchResultItemProps) {
    const { label, Icon, className: typeClass } = TYPE_META[hit.type];
    const dateLabel = formatNextEventStart(hit.nextEventStart);

    return (
        <Command.Item value={`${hit.type}-${hit.id}`} onSelect={onPick} className={styles.item}>
            <span className={styles.itemMain}>
                <span className={styles.thumb}>
                    <CoverImage src={hit.image} alt="" height="fill" className={styles.thumbImage} />
                    <span className={cn(styles.typeBadge, typeClass)}>
                        <Icon size={11} strokeWidth={2.5} aria-hidden />
                        <span className="sr-only">{label}</span>
                    </span>
                </span>
                <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{hit.title}</span>
                    <span className={styles.itemSubtitle}>
                        <span className={styles.subtitleText}>{hit.subtitle}</span>
                        {dateLabel && <span className={styles.inlineDate}>· {dateLabel}</span>}
                    </span>
                </span>
                {dateLabel && <span className={styles.itemDate}>{dateLabel}</span>}
            </span>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onView();
                }}
                aria-label="View"
                title="Open page"
                className={styles.viewButton}
            >
                <ChevronRight size={18} aria-hidden />
            </button>
        </Command.Item>
    );
}
