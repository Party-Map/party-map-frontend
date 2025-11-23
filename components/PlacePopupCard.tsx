"use client"

import Link from 'next/link'
import type {EventType, Place, TagDisplayPopup, UpcomingEventByPlace} from '@/lib/types'
import {EVENT_TYPE_BADGE_CLASSES, EVENT_TYPE_LABELS} from '@/lib/constants'
import {ArrowRight, CalendarDays, X} from 'lucide-react'
import {cn} from "@/lib/utils";

function formatUpcoming(iso: string) {
    const date = new Date(iso)
    const now = new Date()
    const sameDay = date.toDateString() === now.toDateString()

    if (sameDay) return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    })

    const inYear = date.getFullYear() === now.getFullYear()
    return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        ...(inYear ? {} : {
            year: 'numeric'
        })
    })
}

export default function PlacePopupCard({place, upcomingEvent, onClose}: {
    place: Place
    upcomingEvent?: UpcomingEventByPlace | null
    onClose: () => void
}) {
    const title = upcomingEvent ? upcomingEvent.title : place.name
    const longTitle = title.length > 28
    const image = upcomingEvent?.image || place.image
    const startLabel = upcomingEvent ? formatUpcoming(upcomingEvent.start) : null

    const displayTags: TagDisplayPopup[] = (() => {
        const tags: TagDisplayPopup[] = []

        if (upcomingEvent?.kind) {
            tags.push({
                key: `kind-${upcomingEvent.kind}`,
                label: upcomingEvent.kind,
                kind: upcomingEvent.kind,
                isKind: true,
            })
        }

        const kindLower = upcomingEvent?.kind?.toLowerCase()
        const placeTagChips = place.tags
            .filter(t => !kindLower || t.toLowerCase() !== kindLower)
            .slice(0, 3)
            .map<TagDisplayPopup>(t => ({
                key: t,
                label: t,
                kind: undefined,
                isKind: false,
            }))

        tags.push(...placeTagChips)
        return tags
    })()

    return (
        <div
            className={`place-popup-card ${longTitle ? 'w-88 md:w-80' : 'w-80 md:w-72'} max-w-[calc(100vw-1.25rem)] overflow-hidden rounded-2xl
                 ring-1 ring-white/10 backdrop-blur-md`}
        >
            <Link
                href={upcomingEvent ? `/events/${upcomingEvent.eventId}` : `/places/${place.id}`}
                className="relative h-28 bg-cover bg-center block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60
                   transition-transform duration-300 ease-out hover:scale-[1.04] will-change-transform
                   hover:brightness-105 overflow-hidden"
                style={{backgroundImage: `url(${image}`}}
                aria-label={`Open ${upcomingEvent ? 'event ' + title : 'place ' + place.name}`}
                title={upcomingEvent ? `View event: ${title}` : `View place: ${place.name}`}
            >
                <span className="sr-only">{upcomingEvent ? 'View event' : 'View place'}</span>
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full
                     bg-black/45 dark:bg-black/55 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium tracking-wide
                     text-white ring-1 ring-white/15 shadow-sm select-none"
                >
                  {upcomingEvent ? 'View event' : 'View place'}
                    <ArrowRight className="h-3 w-3 opacity-80"/>
                </span>
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300
                     bg-gradient-to-tr from-black/25 via-transparent to-black/10"/>
            </Link>
            <div className="p-3">
                {longTitle ? (
                    <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <span
                              className="block text-base leading-snug font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm pm-line-clamp-2">
                            {upcomingEvent ? upcomingEvent.title : place.name}
                          </span>
                        </div>
                        {upcomingEvent && (
                            <span className="flex-shrink-0 self-start whitespace-nowrap inline-flex items-center gap-1 rounded-full
                            bg-violet-950/60 dark:bg-violet-800/40 text-violet-200 px-2 py-0.5 text-[10px] ring-1 ring-violet-500/30"
                            >
                            <CalendarDays className="h-3 w-3"/>{startLabel}
                          </span>
                        )}
                    </div>
                ) : (
                    <div className="relative">
                        {upcomingEvent && (
                            <span className="absolute right-0 top-0 whitespace-nowrap inline-flex items-center gap-1 rounded-full
                          bg-violet-950/60 dark:bg-violet-800/40 text-violet-200 px-2 py-0.5 text-[10px] ring-1 ring-violet-500/30"
                            >
                            <CalendarDays className="h-3 w-3"/>{startLabel}
                          </span>
                        )}
                        <span className="block pr-20 text-base leading-snug font-bold tracking-tight text-slate-900
                        dark:text-white drop-shadow-sm whitespace-nowrap"
                        >
                          {upcomingEvent ? upcomingEvent.title : place.name}
                        </span>
                    </div>
                )}
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                    <Link
                        href={`/places/${place.id}`}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[12px] font-semibold
                       bg-violet-100/70 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200
                       border border-violet-300/50 dark:border-violet-700/40 shadow-sm
                       hover:bg-violet-200/70 dark:hover:bg-violet-800/60 transition-colors"
                    >
                        {place.name}
                    </Link>
                </div>
                <div className="mt-2 flex items-center">
                    <div className="flex flex-wrap items-center gap-1 flex-1 pr-2">
                        {displayTags.map(tag => {
                            const common =
                                'rounded-full px-2 py-0.5 text-[10px] font-medium ' +
                                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50'

                            if (tag.isKind) {
                                const rawKind = tag.label as EventType

                                return (
                                    <Link
                                        key={tag.key}
                                        href={`/tags/${encodeURIComponent(rawKind.toLowerCase())}`}
                                        className={cn(
                                            "px-2.5 py-0.5 text-[11px] font-semibold rounded-full",
                                            EVENT_TYPE_BADGE_CLASSES[rawKind],
                                            common
                                        )}
                                    >
                                        {EVENT_TYPE_LABELS[rawKind]}
                                    </Link>
                                )
                            }

                            return (
                                <Link
                                    key={tag.key}
                                    href={`/tags/${encodeURIComponent(tag.label.toLowerCase())}`}
                                    className={cn(
                                        "bg-violet-100/70 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 " +
                                        "hover:bg-violet-200/70 dark:hover:bg-violet-800/60",
                                        common
                                    )}
                                >
                                    {tag.label}
                                </Link>
                            )
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close popup"
                        className="ml-2 relative inline-flex h-6 w-6 items-center justify-center rounded-full group
                       text-[#FF2800] dark:text-[#FF4a26] ring-1 ring-[#FF2800]/70 dark:ring-[#FF2800]/60
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2800]/70
                       transition-colors"
                    >
                        <span aria-hidden className="absolute inset-0 rounded-full bg-[#FF2800]/35 dark:bg-[#FF2800]/40 opacity-0
                        group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                        />
                        <X className="h-3.5 w-3.5 relative z-[1] transition-colors group-hover:text-[#ff3d19] dark:group-hover:text-[#ff6a47]"/>
                    </button>
                </div>
            </div>
        </div>
    )
}
