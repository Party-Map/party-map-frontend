import { useState } from "react";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/States";
import { cx } from "@/lib/cx";
import { formatDateTimeRange } from "@/lib/dates";
import type { Event, LikedEventsGrouped, LikeTarget, Performer, Place } from "@/lib/types";
import { LikedListItem } from "./LikedListItem";
import styles from "./LikedTabs.module.css";

type LikedTabsProps = {
    events: LikedEventsGrouped;
    places: Place[];
    performers: Performer[];
};

const TABS: { key: LikeTarget; label: string }[] = [
    { key: "events", label: "Events" },
    { key: "places", label: "Places" },
    { key: "performers", label: "Performers" },
];

function eventRows(events: Event[], emptyMessage: string) {
    if (events.length === 0) return <EmptyState message={emptyMessage} />;
    return (
        <ul className={styles.list}>
            {events.map((event) => (
                <LikedListItem
                    key={event.id}
                    target="events"
                    id={event.id}
                    to={`/events/${event.id}`}
                    title={event.title}
                    image={event.image}
                    meta={formatDateTimeRange(event.start, event.end)}
                    kind={event.kind}
                />
            ))}
        </ul>
    );
}

/** Events / Places / Performers tabs of the likes page. */
export function LikedTabs({ events, places, performers }: LikedTabsProps) {
    const [active, setActive] = useState<LikeTarget>("events");

    return (
        <>
            <div className={styles.tabs} role="tablist" aria-label="Liked items">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        id={`liked-tab-${tab.key}`}
                        aria-selected={active === tab.key}
                        className={cx(styles.tab, active === tab.key && styles.tabActive)}
                        onClick={() => setActive(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <Card padded role="tabpanel" aria-labelledby={`liked-tab-${active}`}>
                {active === "events" && (
                    <div className={styles.sections}>
                        <section>
                            <h2 className="section-title">Upcoming events</h2>
                            {eventRows(events.upcoming, "No upcoming events.")}
                        </section>
                        <section>
                            <h2 className="section-title">Past events</h2>
                            {eventRows(events.past, "No past events.")}
                        </section>
                    </div>
                )}

                {active === "places" && (
                    <section>
                        <h2 className="section-title">Places</h2>
                        {places.length === 0 ? (
                            <EmptyState message="You haven’t liked any places yet." />
                        ) : (
                            <ul className={styles.list}>
                                {places.map((place) => (
                                    <LikedListItem
                                        key={place.id}
                                        target="places"
                                        id={place.id}
                                        to={`/places/${place.id}`}
                                        title={place.name}
                                        image={place.image}
                                        secondary={place.city}
                                        meta={place.address}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                {active === "performers" && (
                    <section>
                        <h2 className="section-title">Performers</h2>
                        {performers.length === 0 ? (
                            <EmptyState message="You haven’t liked any performers yet." />
                        ) : (
                            <ul className={styles.list}>
                                {performers.map((performer) => (
                                    <LikedListItem
                                        key={performer.id}
                                        target="performers"
                                        id={performer.id}
                                        to={`/performers/${performer.id}`}
                                        title={performer.name}
                                        image={performer.image}
                                        secondary={performer.genre}
                                        meta={performer.bio}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>
                )}
            </Card>
        </>
    );
}
