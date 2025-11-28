import {Role} from "@/lib/auth/role";
import {requireAdminRole} from "@/app/admin/admin-roles";
import Link from "next/link";
import {fetchMyEvents} from "@/lib/api/events";
import {EventAdminListItem} from "@/components/EventAdminListItem";

export default async function AdminEventsPage() {
    const session = await requireAdminRole(Role.EVENT_ORGANIZER_USER)
    const ownedEvents = await fetchMyEvents(session);

    return (
        <>
            <div className="flex flex-row justify-between ">
                <h1 className="text-2xl font-bold mb-2">Events admin</h1>
                <button>
                    <Link href="/admin/places/new"
                          className="flex-1 px-3 py-2 text-sm font-medium text-center rounded-lg cursor-pointer bg-violet-600 text-white">
                        Add a new Event
                    </Link>
                </button>
            </div>
            <ul className="space-y-3">
                {ownedEvents && ownedEvents.map((e) => (
                    <EventAdminListItem
                        key={e.id}
                        href={`/admin/events/${e.id}`}
                        title={e.title}
                        start={e.start}
                        end={e.end}
                        placeName={e.placeName}
                    />
                ))}
            </ul>
        </>
    )
}