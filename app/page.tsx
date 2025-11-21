import MapClient from '@/app/map/MapClient'
import {getDataSource} from '@/lib/dataSource'
import TopBar from "@/components/TopBar";
import BottomBar from "@/components/BottomBar";
import Toast from "@/components/Toast";

export const revalidate = 60

export default async function HomePage() {
    const ds = getDataSource()
    const places = await ds.getPlaces()
    const events = await ds.getEvents()

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
