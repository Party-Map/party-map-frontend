import type { ReactNode } from 'react'
import { MapPin, CalendarDays, User2, Tag } from 'lucide-react'
import type { SearchHit } from '@/lib/types'

export type SearchTypeMeta = {
    icon: ReactNode
    bg: string
    ring: string
    fg: string
    label: string
}

export const SEARCH_TYPE_META: Record<SearchHit['type'], SearchTypeMeta> = {
    place: {
        icon: <MapPin className="h-3.5 w-3.5" />,
        bg: 'bg-emerald-950/70 dark:bg-emerald-900/40',
        ring: 'ring-emerald-500/25',
        fg: 'text-emerald-200',
        label: 'Place',
    },
    event: {
        icon: <CalendarDays className="h-3.5 w-3.5" />,
        bg: 'bg-violet-950/70 dark:bg-violet-900/40',
        ring: 'ring-violet-500/25',
        fg: 'text-violet-200',
        label: 'Event',
    },
    performer: {
        icon: <User2 className="h-3.5 w-3.5" />,
        bg: 'bg-rose-950/70 dark:bg-rose-900/40',
        ring: 'ring-rose-500/25',
        fg: 'text-rose-200',
        label: 'Performer',
    },
    tag: {
        icon: <Tag className="h-3.5 w-3.5" />,
        bg: 'bg-zinc-900/70 dark:bg-zinc-800/50',
        ring: 'ring-zinc-400/25',
        fg: 'text-zinc-200',
        label: 'Tag',
    },
}
