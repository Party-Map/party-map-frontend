"use client"

import Link from "next/link"

export function AdminPerformerListItem({
                                           href,
                                           name,
                                       }: {
    href: string
    name: string

}) {
    return (
        <li className="flex items-center justify-between gap-3 sm:gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-zinc-950 px-3 py-3 sm:px-4 sm:py-4">
            <div className="min-w-0">
                <p className="font-semibold break-words">
                    {name}
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
