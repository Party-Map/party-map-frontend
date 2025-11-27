import React from "react"
import Link from "next/link"
import {getJwtSession} from "@/lib/auth/server-session"
import DetailPageLayout from "@/components/DetailPageLayout"
import {AdminTabs} from "@/components/AdminTabs"
import AdminPageLayout from "@/components/AdminPageLayout";
import {Role} from "@/lib/auth/role";
import SignInRequired from "@/components/SignInRequired";

export default async function AdminLayout({children}: {
    children: React.ReactNode
}) {
    const session = await getJwtSession()

    if (!session) {
        return <SignInRequired callback="/admin" message="You need to be signed in to view your Admin page."/>
    }

    if (!session.isAdmin()) {
        return (
            <DetailPageLayout>
                <p className="text-2xl font-bold">You have no access to admin page.</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    Please contact an admin to acquire access to admin page.
                </p>
                <Link
                    href={`/profile`}
                    className="mt-4 inline-flex items-center rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover-bg-violet-400"
                >
                    Go to Profile
                </Link>
            </DetailPageLayout>
        )
    }

    const roleToTab: Partial<Record<Role, { href: string; label: string }>> = {
        [Role.PLACE_MANAGER_USER]: {
            href: "/admin/places",
            label: "Manage your Places",
        },
        [Role.PERFORMER_MANAGER_USER]: {
            href: "/admin/performers",
            label: "Manage your Performers",
        },
        [Role.EVENT_ORGANIZER_USER]: {
            href: "/admin/events",
            label: "Manage your Events",
        },
    }

    const tabs = session.getRoles()
        .map(role => roleToTab[role]) // Map to a role
        .filter(v => !!v) // Make sure there are no undefined

    return (
        <AdminPageLayout>
            <>
                {tabs.length > 1 && (
                    <AdminTabs
                        tabs={tabs}
                        activeClassName="flex-1 px-3 py-2 text-sm font-medium text-center rounded-lg cursor-pointer bg-violet-600 text-white"
                        inactiveClassName="flex-1 px-3 py-2 text-sm font-medium text-center rounded-lg cursor-pointer bg-gray-300 dark:bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200"
                    />
                )}
                <div className="mt-6">
                    {children}
                </div>
            </>
        </AdminPageLayout>
    )
}
