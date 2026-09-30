import { ArrowRight, CalendarDays, X } from "lucide-react";
import { Link } from "react-router";
import { CoverImage } from "@/components/CoverImage";
import { KindBadge } from "@/components/KindBadge";
import { cx } from "@/lib/cx";
import { formatNextEventStart } from "@/lib/dates";
import type { Place, UpcomingEventByPlace } from "@/lib/types";
import styles from "./PlacePopupCard.module.css";

/** Titles longer than this wrap onto two lines and widen the card. */
export const LONG_TITLE_LENGTH = 28;
const MAX_TAGS = 3;

/** Map search for a tag or event kind. */
export function searchHref(term: string): string {
    return `/?q=${encodeURIComponent(term.toLowerCase())}`;
}

type PlacePopupCardProps = {
    place: Place;
    upcomingEvent: UpcomingEventByPlace | null;
    onClose: () => void;
};

/** Card shown in the marker popup: the next event at the place, or the place itself. */
export function PlacePopupCard({ place, upcomingEvent, onClose }: PlacePopupCardProps) {
    const title = upcomingEvent ? upcomingEvent.title : place.name;
    const longTitle = title.length > LONG_TITLE_LENGTH;
    const image = upcomingEvent?.image || place.image;
    const startLabel = upcomingEvent ? formatNextEventStart(upcomingEvent.start) : null;
    const href = upcomingEvent ? `/events/${upcomingEvent.eventId}` : `/places/${place.id}`;
    const kind = upcomingEvent?.kind ?? null;
    const kindLower = kind?.toLowerCase();
    const tags = place.tags.filter((tag) => tag.toLowerCase() !== kindLower).slice(0, MAX_TAGS);

    return (
        <div className={cx(styles.card, longTitle && styles.wide)}>
            <div className={styles.media}>
                <Link
                    to={href}
                    className={styles.imageLink}
                    aria-label={upcomingEvent ? `Open event ${title}` : `Open place ${place.name}`}
                    title={upcomingEvent ? `View event: ${title}` : `View place: ${place.name}`}
                >
                    <CoverImage src={image} alt="" height="md" className={styles.image} />
                    <span aria-hidden className={styles.imageTint} />
                </Link>
                <span aria-hidden className={styles.viewChip}>
                    {upcomingEvent ? "View event" : "View place"}
                    <ArrowRight size={12} aria-hidden />
                </span>
            </div>

            <div className={styles.body}>
                <div className={styles.titleRow}>
                    <span className={cx(styles.title, longTitle ? styles.titleClamp : styles.titleNowrap)}>
                        {title}
                    </span>
                    {startLabel && (
                        <span className={styles.dateChip}>
                            <CalendarDays size={12} aria-hidden />
                            {startLabel}
                        </span>
                    )}
                </div>

                <div className={styles.placeRow}>
                    <Link to={`/places/${place.id}`} className={styles.placeChip}>
                        {place.name}
                    </Link>
                </div>

                <div className={styles.footer}>
                    <div className={styles.tags}>
                        {kind && (
                            <Link to={searchHref(kind)} className={styles.kindLink}>
                                <KindBadge kind={kind} />
                            </Link>
                        )}
                        {tags.map((tag) => (
                            <Link key={tag} to={searchHref(tag)} className={styles.tagChip}>
                                {tag}
                            </Link>
                        ))}
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close popup" className={styles.close}>
                        <X size={14} aria-hidden />
                    </button>
                </div>
            </div>
        </div>
    );
}
