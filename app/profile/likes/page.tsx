import {getJwtSession} from "@/lib/auth/server-session";
import DetailPageLayout from "@/app/DetailPageLayout";
import Link from "next/link";
import {fetchLikedEvents, fetchLikedPerformers, fetchLikedPlaces} from "@/lib/api/likes";
import type {Event as PartyEvent, LikedEventsGrouped, Performer, Place} from "@/lib/types";
import {LikedTabs} from "@/app/profile/likes/LikedTabs";

export default async function ProfilePage() {
    const session = await getJwtSession();
    const callback = "/profile";

    if (!session) {
        return (
            <DetailPageLayout>
                <div
                    className="overflow-hidden rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur shadow-sm">
                    <div className="p-4">
                        <h1 className="text-2xl font-bold">Sign in required</h1>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                            You need to be signed in to view your likes.
                        </p>

                        <Link
                            href={`/auth/login?callback=${encodeURIComponent(callback)}`}
                            className="mt-4 inline-flex items-center rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400"
                        >
                            Go to login
                        </Link>
                    </div>
                </div>
            </DetailPageLayout>
        );
    }

    let groupedEvents: LikedEventsGrouped = {upcoming: [], past: []};
    let places: Place[] = [];
    let performers: Performer[] = [];

    try {
        groupedEvents = await fetchLikedEvents(session);
    } catch (err) {
        console.error("Failed to fetch liked events:", err);
    }

    try {
        places = await fetchLikedPlaces(session);
        console.log(places);
    } catch (err) {
        console.error("Failed to fetch liked places:", err);
    }

    try {
        performers = await fetchLikedPerformers(session);
    } catch (err) {
        console.error("Failed to fetch liked performers:", err);
    }

    const upcomingEvents: PartyEvent[] = groupedEvents.upcoming ?? [];
    const pastEvents: PartyEvent[] = groupedEvents.past ?? [];

    return (
        <DetailPageLayout>
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">Your likes</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    View and manage the events, places and performers you&apos;ve liked.
                </p>

                <LikedTabs
                    upcomingEvents={upcomingEvents}
                    pastEvents={pastEvents}
                    places={places}
                    performers={performers}
                />
            </div>
        </DetailPageLayout>
    );
}
