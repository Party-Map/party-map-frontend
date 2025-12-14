import React from 'react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import BottomBar from '@/components/BottomBar'

export default function DetailPageLayout({
                                             children,
                                             backHref = '/',
                                             footerSection,
                                         }: {
    children: React.ReactNode
    backHref?: string
    footerSection?: React.ReactNode
}) {
    return (
        <>
            <TopBar/>
            <BottomBar/>
            <main className="pt-24 px-4 pb-24 md:pb-0">
                <Link href={backHref} className="text-violet-600 dark:text-violet-300 text-sm">
                    ← Back
                </Link>

                {/* main card*/}
                <div className="mt-2">
                    {children}
                </div>

                {/* extra content section */}
                {footerSection && (
                    <section className="mt-4">
                        {footerSection}
                    </section>
                )}
            </main>
        </>
    )
}
