import 'leaflet/dist/leaflet.css'
import MapClient from '@/app/map/MapClient'
import TopBar from "@/components/TopBar";
import BottomBar from "@/components/BottomBar";
import {fetchPlaces} from "@/lib/api/places";
import {fetchUpcomingEventsForAllPlaces} from "@/lib/api/events";
import {getJwtSession} from "@/lib/auth/server-session";
import {UpcomingEventByPlace} from "@/lib/types";


export default async function HomePage() {
    const session = await getJwtSession()

    const places = await fetchPlaces(session)
    const upComingEventsByPlaces = await fetchUpcomingEventsForAllPlaces(session)
    const upcomingMap = new Map<string, UpcomingEventByPlace>
    for (const u of upComingEventsByPlaces) {
        upcomingMap.set(u.placeId, u)
    }

    return (
        <>
            <TopBar/>
            <BottomBar/>
            <main className="fixed inset-0">
                <MapClient places={places} upcomingMap={upcomingMap}/>
            </main>
        </>
    )
}
