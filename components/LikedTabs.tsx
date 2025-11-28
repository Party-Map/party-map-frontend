"use client"

import {useState} from "react"
import type {Event, LikeTarget as TabKey, Performer, Place} from "@/lib/types"
import {EVENT_TYPE_LABELS} from "@/lib/constants"
import {LikedListItem} from "@/components/LikedListItem"
import {eventDateTimeDisplayFormat} from "@/lib/dateformat";

export function LikedTabs({
                              upcomingEvents,
                              pastEvents,
                              places,
                              performers,
                          }: {
    upcomingEvents?: Event[]
    pastEvents?: Event[]
    places?: Place[]
    performers?: Performer[]
}) {
    const [activeTab, setActiveTab] = useState<TabKey>("events")

    const upcomingList: Event[] = Array.isArray(upcomingEvents) ? upcomingEvents as Event[] : []
    const pastList: Event[] = Array.isArray(pastEvents) ? pastEvents as Event[] : []
    const placesList: Place[] = Array.isArray(places) ? places as Place[] : []
    const performersList: Performer[] = Array.isArray(performers) ? performers as Performer[] : []

    const tabClass = (tab: TabKey) =>
        `flex-1 px-3 py-2 text-sm font-medium text-center rounded-lg cursor-pointer ${
            activeTab === tab
                ? "bg-violet-600 text-white"
                : "bg-gray-300 dark:bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200"
        }`

    return (
        <div className="space-y-4 pb-4">
            <div className="flex gap-2">
                <button
                    type="button"
                    className={tabClass("events")}
                    onClick={() => setActiveTab("events")}
                >
                    Events
                </button>
                <button
                    type="button"
                    className={tabClass("places")}
                    onClick={() => setActiveTab("places")}
                >
                    Places
                </button>
                <button
                    type="button"
                    className={tabClass("performers")}
                    onClick={() => setActiveTab("performers")}
                >
                    Performers
                </button>
            </div>

            <div
                className="rounded-2xl border border-gray-300 dark:border-gray-800 bg-amber-50 dark:bg-zinc-950/80 p-4 space-y-6">
                {activeTab === "events" && (
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-lg font-semibold mb-2">Upcoming events</h2>
                            {upcomingList.length === 0 ? (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    No upcoming events.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {upcomingList.map((event) => {
                                        const kindLabel = EVENT_TYPE_LABELS[event.kind]
                                        const timeLabel = eventDateTimeDisplayFormat(event)

                                        return (
                                            <LikedListItem
                                                key={event.id}
                                                target="events"
                                                targetId={event.id}
                                                targetName={event.title}
                                                href={`/events/${event.id}`}
                                                title={event.title}
                                                image={event.image}
                                                metaTop={timeLabel}
                                                metaBottom={kindLabel}
                                            />
                                        )
                                    })}
                                </ul>
                            )}
                        </section>

                        {/* Past */}
                        <section>
                            <h2 className="text-lg font-semibold mb-2">Past events</h2>
                            {pastList.length === 0 ? (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    No past events.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {pastList.map((event) => {
                                        const kindLabel = EVENT_TYPE_LABELS[event.kind]
                                        const timeLabel = eventDateTimeDisplayFormat(event)

                                        return (
                                            <LikedListItem
                                                key={event.id}
                                                target="events"
                                                targetId={event.id}
                                                targetName={event.title}
                                                href={`/events/${event.id}`}
                                                title={event.title}
                                                image={event.image}
                                                metaTop={timeLabel}
                                                metaBottom={kindLabel}
                                            />
                                        )
                                    })}
                                </ul>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === "places" && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Places</h2>
                        {placesList.length === 0 ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                You haven&apos;t liked any places yet.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {placesList.map((place) => (
                                    <LikedListItem
                                        key={place.id}
                                        target="places"
                                        targetId={place.id}
                                        targetName={place.name}
                                        href={`/places/${place.id}`}
                                        title={place.name}
                                        image={place.image}
                                        secondary={place.city}
                                        metaTop={place.address}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {activeTab === "performers" && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Performers</h2>
                        {performersList.length === 0 ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                You haven&apos;t liked any performers yet.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {performersList.map((performer) => (
                                    <LikedListItem
                                        key={performer.id}
                                        target="performers"
                                        targetId={performer.id}
                                        targetName={performer.name}
                                        href={`/performers/${performer.id}`}
                                        title={performer.name}
                                        image={performer.image}
                                        secondary={performer.genre}
                                        metaTop={performer.bio}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}