import Image from 'next/image'
import Link from 'next/link'
import type {Place} from '@/lib/types'

export default function PlaceCard({place}: { place: Place }) {
    return (
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <Image src={place.image} alt={place.name} width={1200} height={600} className="h-40 w-full object-cover"/>
            <div className="p-4">
                <h3 className="text-lg font-semibold">{place.name}</h3>
                <p className="text-sm text-gray-600">{place.address}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                    {place.tags.map(tag => (
                        <span key={tag}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{tag}</span>
                    ))}
                </div>
                <Link href={`/places/${place.id}`}
                      className="mt-3 inline-block text-sm font-medium text-sky-600 hover:underline">Open →</Link>
            </div>
        </div>
    )
}