import React from 'react'
import AdminTopBar from "@/components/AdminTopBar";
import Link from "next/link";

export default function AdminPageLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return (
        <>
            <AdminTopBar/>
            <main className="pt-4 px-4 pb-24 md:pb-0">
                <Link href="/" className="text-violet-600 dark:text-violet-300 text-sm">
                    ← Back to Map
                </Link>
                <div className="mt-2">
                    {children}
                </div>
            </main>
        </>
    )
}
