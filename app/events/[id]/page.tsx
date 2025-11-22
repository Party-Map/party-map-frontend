import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {fmtRange} from '@/lib/time'
import DetailPageLayout from '@/components/DetailPageLayout'
import {fetchEvent} from '@/lib/api/events'
import {getJwtSession} from '@/lib/auth/server-session'
import {fetchPlaceByEventId} from '@/lib/api/places'
import {fetchPerformersByEventId} from '@/lib/api/performers'

export default async function EventPage({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params
    const session = await getJwtSession()

    const event = await fetchEvent(id, session)
    if (!event) return notFound()
    const place = await fetchPlaceByEventId(id, session)
    const performerEntities = await fetchPerformersByEventId(id, session)

    return (
        <DetailPageLayout
            footerSection={
                <>
                    <h2 className="mb-2 text-lg font-semibold">Performers</h2>
                    <ul className="grid grid-cols-1 gap-3">
                        {performerEntities.filter(Boolean).map((p) => (
                            <li
                                key={p!.id}
                                className="rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur p-4 shadow-sm"
                            >
                                <Link
                                    href={`/performers/${p!.id}`}
                                    className="text-violet-600 dark:text-violet-300 hover:underline font-medium"
                                >
                                    {p!.name}
                                </Link>
                                <div className="text-sm text-zinc-600 dark:text-zinc-300">{p!.genre}</div>
                            </li>
                        ))}
                    </ul>
                </>
            }
        >
            <div
                className="overflow-hidden rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur shadow-sm">
                <Image
                    src={event.image}
                    alt={event.title}
                    width={1600}
                    height={900}
                    className="h-56 w-full object-cover"
                />
                <div className="p-4">
                    <h1 className="text-2xl font-bold">{event.title}</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {fmtRange(event.start, event.end)}
                    </p>
                    {place && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            at{' '}
                            <Link
                                href={`/places/${place.id}`}
                                className="text-violet-600 dark:text-violet-300 hover:underline"
                            >
                                {place.name}
                            </Link>
                        </p>
                    )}
                    {event.price && <p className="mt-1 text-sm">Price: {event.price}</p>}
                    <p className="mt-2 text-sm">{event.description}</p>
                </div>
            </div>
        </DetailPageLayout>
    )
}
