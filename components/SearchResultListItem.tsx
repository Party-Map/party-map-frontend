import Link from 'next/link'
import Image from 'next/image'
import { SEARCH_TYPE_META } from '@/components/searchTypeMeta'
import type { SearchHit } from '@/lib/types'
import {cn} from "@/lib/utils";

function formatDateLabel(hit: SearchHit): string | null {
    if (!hit.nextEventStart) return null
    const d = new Date(hit.nextEventStart)
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()

    if (sameDay) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const inYear = d.getFullYear() === now.getFullYear()
    return d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        ...(inYear ? {} : { year: 'numeric' }),
    })
}

export function SearchResultListItem({ hit, onPrimaryClick, onViewClick }: {
    hit: SearchHit
    onPrimaryClick: () => void
    onViewClick: () => void
}) {
    const meta = SEARCH_TYPE_META[hit.type]
    const dateLabel = formatDateLabel(hit)

    return (
        <li>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-violet-50/70 dark:hover:bg-violet-900/30 transition-colors">
                <button
                    type="button"
                    onClick={onPrimaryClick}
                    className="flex flex-1 items-center gap-3 min-w-0 text-left group focus:outline-none"
                >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-white/20 group-hover:ring-violet-400/50 transition-colors">
                        <Image
                            src={hit.image}
                            alt={hit.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                        />
                        <span className="absolute bottom-0 left-0 right-0 text-[10px] font-medium uppercase tracking-wide bg-black/40 text-white text-center leading-tight">
                            {hit.type.charAt(0)}
                        </span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                                {hit.title}
                            </span>
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ring-1",
                                meta.bg, meta.ring,meta.fg
                            )}>
                                {meta.icon}
                                {meta.label}
                            </span>
                        </div>
                        <div className="truncate text-xs text-zinc-600 dark:text-zinc-300">
                            {hit.subtitle}
                        </div>
                    </div>

                    {dateLabel && (
                        <div className="ml-3 hidden sm:flex flex-col items-end text-right">
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 tabular-nums">
                            {dateLabel}
                          </span>
                        </div>
                    )}
                </button>

                <Link
                    href={hit.href}
                    onClick={e => {
                        e.stopPropagation()
                        onViewClick()
                    }}
                    className="ml-2 flex-shrink-0 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium
                     border border-violet-400/50 text-violet-700 dark:text-violet-200 bg-white/60 dark:bg-zinc-900/40
                     hover:bg-violet-50/80 dark:hover:bg-violet-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 shadow-sm"
                >
                    View
                </Link>
            </div>
        </li>
    )
}
