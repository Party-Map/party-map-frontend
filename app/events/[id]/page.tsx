import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import DetailPageLayout from '@/app/DetailPageLayout'
import {fetchEvent} from '@/lib/api/events'
import {getJwtSession} from '@/lib/auth/server-session'
import {fetchPlaceByEventId} from '@/lib/api/places'
import {LikeToggleButton} from "@/components/LikeToggleButton";
import {fetchLikeStatus} from "@/lib/api/likes";
import {SocialLinks} from "@/components/SocialLinks";
import {LineupList} from "@/app/events/[id]/LineupList";
import {eventDateTimeDisplayFormat} from "@/lib/dateformat";
import {ID} from "@/lib/types";

export default async function EventPage({params}: { params: Promise<{ id: ID }> }) {
    const {id} = await params
    const session = await getJwtSession()

    const [event, place, likeStatus] = await Promise.all([
        fetchEvent(id, session),
        fetchPlaceByEventId(id, session),
        session ? fetchLikeStatus("events", id, session) : Promise.resolve(null),
    ])


    if (!event) return notFound()

    const isLiked = likeStatus?.liked ?? false

    return (
        <DetailPageLayout
            footerSection=
                {event.lineupItems && (
                    <LineupList items={event.lineupItems}/>
                )
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
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{event.title}</h1>

                        <LikeToggleButton
                            target="events"
                            targetName={event.title}
                            targetId={id}
                            initialLiked={isLiked}
                        />
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {eventDateTimeDisplayFormat(event)}
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
                    <SocialLinks
                        links={event.links}
                        className="mt-3"
                    />
                </div>
            </div>
        </DetailPageLayout>
    )
}
