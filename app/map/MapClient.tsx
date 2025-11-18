'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import type { Place, Event } from '@/lib/types'
import { useTheme } from '@/components/ThemeProvider'

const MapView = dynamic(() => import('@/app/map/MapView'), { ssr: false })

export default function MapClient({ places, events }: { places: Place[]; events: Event[] }) {
    const { theme } = useTheme()

    const [highlightIds, setHighlightIds] = useState<string[] | undefined>()
    const [activePlaceId, setActivePlaceId] = useState<string | null>(null)
    const [activePlaceIds, setActivePlaceIds] = useState<string[] | null>(null)

    // External highlight trigger (kept on window)
    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as unknown as CustomEvent<{ placeIds: string[] }>
            setHighlightIds(ce.detail.placeIds)
            if (!ce.detail.placeIds.length) {
                setActivePlaceId(null)
                setActivePlaceIds(null)
            }
        }
        window.addEventListener('pm:highlight-places', handler as any)
        return () => window.removeEventListener('pm:highlight-places', handler as any)
    }, [])

    const handleOpenPlace = (id: string) => {
        setActivePlaceIds(null)
        setActivePlaceId(prev => (prev === id ? null : id))
    }

    const handleCloseAllPlaces = () => {
        setActivePlaceId(null)
        setActivePlaceIds(null)
    }

    return (
        <MapView
            places={places}
            events={events}
            isDark={theme === 'dark'}
            highlightIds={highlightIds}
            activePlaceId={activePlaceId}
            activePlaceIds={activePlaceIds ?? undefined}
            onOpenPlace={handleOpenPlace}
            onCloseAllPlaces={handleCloseAllPlaces}
        />
    )
}
