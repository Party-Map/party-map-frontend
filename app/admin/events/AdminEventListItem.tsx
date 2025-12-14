"use client"

import Link from "next/link"
import {dateTimeDisplayFormat} from "@/lib/dateformat";

export function AdminEventListItem({
                                       href,
                                       title,
                                       start,
                                       end,
                                       placeName
                                   }: {
    href: string
    title: string
    start: string
    end: string
    placeName: string

}) {
    return (
        <li className="flex items-center justify-between gap-3 sm:gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-zinc-950 px-3 py-3 sm:px-4 sm:py-4">
            <div className="min-w-0">
                <p className="font-semibold break-words">
                    {title}
                </p>
                <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-200 truncate">
                    {dateTimeDisplayFormat(start, end)}
                </p>
                <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-200 truncate">
                    {placeName}
                </p>
            </div>

            <Link
                href={href}
                className="inline-flex flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-zinc-900 dark:text-gray-100 dark:hover:bg-zinc-800"
            >
                View
            </Link>
        </li>
    )
}
