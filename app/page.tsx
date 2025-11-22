import MapClient from '@/app/map/MapClient'
import TopBar from "@/components/TopBar";
import BottomBar from "@/components/BottomBar";
import Toast from "@/components/Toast";
import {fetchPlaces} from "@/lib/api/places";
import {fetchEvents} from "@/lib/api/events";
import {getJwtSession} from "@/lib/auth/server-session";

export default async function HomePage() {
    const session = await getJwtSession()

    const places = await fetchPlaces(session)
    const events = await fetchEvents(session)

    return (
        <>
            <TopBar/>
            <BottomBar/>
            <Toast/>
            <main className="fixed inset-0">
                <MapClient places={places} events={events}/>
            </main>
        </>
    )
}
