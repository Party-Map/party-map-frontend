import { Tabs } from "@base-ui/react/tabs";

import type { Event, LikedEventsGrouped, LikeTarget, Performer, Place } from "@/api/types";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/States";
import text from "@/components/typography.module.scss";
import { formatDateTimeRange } from "@/lib/dates";

import { LikedListItem } from "./LikedListItem";
import styles from "./LikedTabs.module.scss";

interface LikedTabsProps {
    events: LikedEventsGrouped;
    places: Place[];
    performers: Performer[];
}

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

/** Events / Places / Performers tabs of the likes page (Base UI Tabs: arrow keys move between tabs). */
export function LikedTabs({ events, places, performers }: LikedTabsProps) {
    return (
        <Tabs.Root defaultValue={"events" satisfies LikeTarget}>
            <Tabs.List className={styles.tabs} aria-label="Liked items">
                {TABS.map((tab) => (
                    <Tabs.Tab key={tab.key} value={tab.key} className={styles.tab}>
                        {tab.label}
                    </Tabs.Tab>
                ))}
            </Tabs.List>

            <Tabs.Panel value="events" className={styles.panel}>
                <Card padded>
                    <div className={styles.sections}>
                        <section>
                            <h2 className={text.sectionTitle}>Upcoming events</h2>
                            {eventRows(events.upcoming, "No upcoming events.")}
                        </section>
                        <section>
                            <h2 className={text.sectionTitle}>Past events</h2>
                            {eventRows(events.past, "No past events.")}
                        </section>
                    </div>
                </Card>
            </Tabs.Panel>

            <Tabs.Panel value="places" className={styles.panel}>
                <Card padded>
                    <section>
                        <h2 className={text.sectionTitle}>Places</h2>
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
                </Card>
            </Tabs.Panel>

            <Tabs.Panel value="performers" className={styles.panel}>
                <Card padded>
                    <section>
                        <h2 className={text.sectionTitle}>Performers</h2>
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
                </Card>
            </Tabs.Panel>
        </Tabs.Root>
    );
}
