import type { Metadata, Viewport } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import './map.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import TopBar from '@/components/TopBar'
import BottomBar from '@/components/BottomBar'
import Toast from '@/components/Toast'
import GdprConsent from '@/components/GdprConsent'
import {HighlightProvider} from "@/components/HighlightContextProvider";

export const metadata: Metadata = {
  title: 'PartyMap',
  description: 'Find parties on the map — places, events, performers',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <ThemeProvider>
          <HighlightProvider>
          <TopBar />
          <BottomBar />
          <Toast />
          {children}
          </HighlightProvider>
          <GdprConsent />
      </ThemeProvider>
      </body>
    </html>
  )
}
