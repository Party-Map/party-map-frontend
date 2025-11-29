import {Role} from "@/lib/auth/role";
import {requireAdminRole} from "@/app/admin/admin-roles";
import Link from "next/link";
import {fetchMyEvents} from "@/lib/api/events";
import {EventAdminListItem} from "@/components/EventAdminListItem";
import {fetchMyEventPlans} from "@/lib/api/eventPlan";
import EventPlanAdminListItem from "@/components/EventPlanAdminListItem";

export default async function AdminEventsPage() {
    const session = await requireAdminRole(Role.EVENT_ORGANIZER_USER);
    const ownedEvents = await fetchMyEvents(session) || [];
    const ownedEventPlans = await fetchMyEventPlans(session) || [];
    const now = new Date();

    const liveEvents = ownedEvents.filter((e) => new Date(e.end) >= now);

    const pastEvents = ownedEvents.filter((e) => new Date(e.end) < now);

    return (
        <div className="flex w-full gap-8 pb-6">
            <div className="flex flex-col flex-1">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Event planning</h1>
                    <Link
                        href="/admin/events/new"
                        className="px-3 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white"
                    >
                        Add a new Event Plan
                    </Link>
                </div>

                <ul className="space-y-3">
                    {ownedEventPlans.map((e) => (
                        <EventPlanAdminListItem
                            key={e.id}
                            href={`/admin/events/${e.id}`}
                            title={e.title}
                            startDateTime={e.startDateTime}
                            endDateTime={e.endDateTime}
                        />
                    ))}
                </ul>
            </div>

            {/* Right column */}
            <div className="flex flex-col flex-1">
                <h1 className="text-2xl font-bold mb-4">Your live events</h1>

                {/* Live / upcoming events */}
                <ul className="space-y-3">
                    {liveEvents.map((e) => (
                        <EventAdminListItem
                            key={e.id}
                            href={`/events/${e.id}`}
                            title={e.title}
                            start={e.start}
                            end={e.end}
                            placeName={e.placeName}
                        />
                    ))}
                    {liveEvents.length === 0 && (
                        <li className="text-sm text-gray-500">
                            You have no live events.
                        </li>
                    )}
                </ul>

                {/* Collapsible past events */}
                <details className="mt-6">
                    <summary className="text-lg font-semibold cursor-pointer select-none">
                        Past events ({pastEvents.length})
                    </summary>
                    <ul className="mt-3 space-y-3">
                        {pastEvents.map((e) => (
                            <EventAdminListItem
                                key={e.id}
                                href={`/events/${e.id}`}
                                title={e.title}
                                start={e.start}
                                end={e.end}
                                placeName={e.placeName}
                            />
                        ))}
                        {pastEvents.length === 0 && (
                            <li className="text-sm text-gray-500">
                                You have no past events.
                            </li>
                        )}
                    </ul>
                </details>
            </div>
        </div>
    );
}
