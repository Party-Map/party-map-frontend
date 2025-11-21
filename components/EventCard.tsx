import Image from 'next/image'
import Link from 'next/link'
import type {Event, Place} from '@/lib/types'
import {fmtRange} from '@/lib/time'

export default function EventCard({event, place}: { event: Event, place?: Place }) {
    return (
        <div
            className="rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/70 backdrop-blur-sm shadow-sm">
            <Image src={event.image} alt={event.title} width={1200} height={600} className="h-40 w-full object-cover"/>
            <div className="p-4">
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p className="text-sm text-gray-600">{fmtRange(event.start, event.end)}</p>
                {place && (
                    <p className="text-sm text-gray-600">at <Link className="text-sky-600 hover:underline"
                                                                  href={`/places/${place.id}`}>{place.name}</Link></p>
                )}
                <div className="mt-2 flex items-center justify-between">
                    <Link href={`/events/${event.id}`} className="text-sm font-medium text-sky-600 hover:underline">Details
                        →</Link>
                    {event.price &&
                        <span className="text-xs rounded-full bg-sky-50 px-2 py-1 text-sky-700">{event.price}</span>}
                </div>
            </div>
        </div>
    )
}