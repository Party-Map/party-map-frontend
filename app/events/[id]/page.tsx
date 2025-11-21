import Image from 'next/image'
import Link from 'next/link'
import { getDataSource, createRepositories } from '@/lib/dataSource'
import { notFound } from 'next/navigation'
import { fmtRange } from '@/lib/time'
import TopBar from "@/components/TopBar";
import BottomBar from "@/components/BottomBar";
import Toast from "@/components/Toast";

export const revalidate = 60

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ds = getDataSource()
  const { events, places, performers } = createRepositories(ds)
  const event = await events.byId(id)
  if (!event) return notFound()
  const place = await places.byId(event.placeId)
  const performerEntities = await Promise.all(event.performerIds.map(pid => performers.byId(pid)))

  return (
    <>
        <TopBar/>
        <BottomBar/>
        <Toast/>
        <main className="pt-24 px-4 pb-24 md:pb-0">
            <Link href="/" className="text-violet-600 dark:text-violet-300 text-sm">← Back</Link>
            <div className="mt-2 overflow-hidden rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur shadow-sm">
                <Image src={event.image} alt={event.title} width={1600} height={900} className="h-56 w-full object-cover"/>
                <div className="p-4">
                    <h1 className="text-2xl font-bold">{event.title}</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{fmtRange(event.start, event.end)}</p>
                    {place && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            at <Link href={`/places/${place.id}`} className="text-violet-600 dark:text-violet-300 hover:underline">{place.name}</Link>
                        </p>
                    )}
                    {event.price && <p className="mt-1 text-sm">Price: {event.price}</p>}
                    <p className="mt-2 text-sm">{event.description}</p>
                </div>
            </div>

            <section className="mt-4">
                <h2 className="mb-2 text-lg font-semibold">Performers</h2>
                <ul className="grid grid-cols-1 gap-3">
                    {performerEntities.filter(Boolean).map(p => (
                        <li key={p!.id} className="rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur p-4 shadow-sm">
                            <Link href={`/performers/${p!.id}`} className="text-violet-600 dark:text-violet-300 hover:underline font-medium">{p!.name}</Link>
                            <div className="text-sm text-zinc-600 dark:text-zinc-300">{p!.genre}</div>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    </>
  )
}
