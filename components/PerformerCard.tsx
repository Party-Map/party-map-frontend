import Image from 'next/image'
import Link from 'next/link'
import type {Performer} from '@/lib/types'

export default function PerformerCard({performer}: { performer: Performer }) {
    return (
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <Image src={performer.image} alt={performer.name} width={1200} height={600}
                   className="h-40 w-full object-cover"/>
            <div className="p-4">
                <h3 className="text-lg font-semibold">{performer.name}</h3>
                <p className="text-sm text-gray-600">{performer.genre}</p>
                <Link href={`/performers/${performer.id}`}
                      className="mt-3 inline-block text-sm font-medium text-sky-600 hover:underline">Open →</Link>
            </div>
        </div>
    )
}