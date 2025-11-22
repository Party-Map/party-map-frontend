import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import DetailPageLayout from '@/components/DetailPageLayout'
import {getJwtSession} from '@/lib/auth/server-session'
import {fetchPerformer} from '@/lib/api/performers'
import {fetchEventsByPerformerId} from '@/lib/api/events'

export default async function PerformerPage({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params
    const session = await getJwtSession()

    const performer = await fetchPerformer(id, session)
    if (!performer) return notFound()
    const performerEvents = await fetchEventsByPerformerId(id, session)

    return (
        <DetailPageLayout
            footerSection={
                <>
                    <h2 className="mb-2 text-lg font-semibold">Events</h2>
                    <ul className="grid grid-cols-1 gap-3">
                        {performerEvents.length === 0 && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">No events yet.</p>
                        )}
                        {performerEvents.map((e) => (
                            <li
                                key={e.id}
                                className="rounded-2xl border border-white/10 bg-white/85 dark:bg-zinc-950/80 backdrop-blur p-4"
                            >
                                <Link
                                    href={`/events/${e.id}`}
                                    className="text-violet-600 dark:text-violet-300 hover:underline font-medium"
                                >
                                    {e.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </>
            }
        >
            <div
                className="overflow-hidden rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur shadow-sm">
                <Image
                    src={performer.image}
                    alt={performer.name}
                    width={1600}
                    height={900}
                    className="h-56 w-full object-cover"
                />
                <div className="p-4">
                    <h1 className="text-2xl font-bold">{performer.name}</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{performer.genre}</p>
                    <p className="mt-2 text-sm">{performer.bio}</p>
                    {performer.links && (
                        <div className="mt-2 flex gap-3 text-sm">
                            {performer.links.map((l) => (
                                <a
                                    key={l.url}
                                    href={l.url}
                                    target="_blank"
                                    className="text-violet-600 dark:text-violet-300 hover:underline"
                                >
                                    {l.type}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DetailPageLayout>
    )
}
