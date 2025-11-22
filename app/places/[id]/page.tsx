import Image from 'next/image'
import {notFound} from 'next/navigation'
import EventCard from '@/components/EventCard'
import DetailPageLayout from '@/components/DetailPageLayout'
import {fetchPlace} from '@/lib/api/places'
import {getJwtSession} from '@/lib/auth/server-session'
import {fetchEventSByPlaceId} from '@/lib/api/events'


export default async function PlacePage({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params
    const session = await getJwtSession()

    const place = await fetchPlace(id, session)
    if (!place) return notFound()
    const placeEvents = await fetchEventSByPlaceId(id, session)

    return (
        <DetailPageLayout
            footerSection={
                <>
                    <h2 className="mb-2 text-lg font-semibold">Upcoming events</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {placeEvents.length === 0 && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">No events yet.</p>
                        )}
                        {placeEvents.map((e) => (
                            <EventCard key={e.id} event={e} place={place}/>
                        ))}
                    </div>
                </>
            }
        >
            <div
                className="overflow-hidden rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur shadow-sm">
                <Image
                    src={place.image}
                    alt={place.name}
                    width={1600}
                    height={900}
                    className="h-56 w-full object-cover"
                />
                <div className="p-4">
                    <h1 className="text-2xl font-bold">{place.name}</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {place.address}, {place.city}
                    </p>
                    <p className="mt-2 text-sm">{place.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {place.tags.map((t) => (
                            <span
                                key={t}
                                className="rounded-full bg-zinc-100/70 dark:bg-zinc-800/60 px-2 py-0.5 text-xs"
                            >
                {t}
              </span>
                        ))}
                    </div>
                </div>
            </div>
        </DetailPageLayout>
    )
}
