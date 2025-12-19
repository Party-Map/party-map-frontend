import type {Metadata, Viewport} from 'next'
import './globals.css'
import {ThemeContextProvider} from '@/app/ThemeContextProvider'
import GdprConsent from '@/components/GdprConsent'
import {HighlightContextProvider} from "@/app/HighlightContextProvider";
import SessionContextProvider from "@/app/SessionContextProvider";
import {cookies} from "next/headers";
import {Toaster} from "react-hot-toast";


export const metadata: Metadata = {
    title: 'PartyMap',
    description: 'Find parties on the map — places, events, performers',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}
export default async function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className="min-h-dvh bg-amber-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeContextProvider>
            <HighlightContextProvider>
                <SessionContextProvider
                    jwtAccessToken={(await cookies()).get('access_token')?.value!}
                >
                    {children}
                </SessionContextProvider>
            </HighlightContextProvider>
            <GdprConsent/>
        </ThemeContextProvider>
        <Toaster position="top-center" toastOptions={{duration: 1500}}/>
        </body>
        </html>
    )
}
