"use client"

import Link from "next/link"
import {usePathname} from "next/navigation"

type Tab = {
    href: string
    label: string
}

export function AdminTabs({
                              tabs,
                              activeClassName,
                              inactiveClassName,
                          }: {
    tabs: Tab[]
    activeClassName: string
    inactiveClassName: string
}) {
    const pathname = usePathname()

    return (
        <div className="space-y-4 pb-4">
            <div className="flex gap-2">
                {tabs.map((tab) => {
                    const isActive =
                        pathname === tab.href || pathname.startsWith(`${tab.href}/`)

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={isActive ? activeClassName : inactiveClassName}
                        >
                            {tab.label}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
