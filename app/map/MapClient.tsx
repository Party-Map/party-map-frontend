'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import type { Place, Event } from '@/lib/types'
import { useTheme } from '@/components/ThemeProvider'
import {useHighlight} from "@/components/HighlightContextProvider";

const MapView = dynamic(() => import('@/app/map/MapView'), { ssr: false })

export default function MapClient({ places, events }: { places: Place[]; events: Event[] }) {
    const { theme } = useTheme()

    const { highlightIds } = useHighlight()
    const [openPopupId, setOpenPopupId] = useState<string | null>(null)

    useEffect(() => {
        setOpenPopupId(null)
    }, [highlightIds])

    const handleOpenPlace = (id: string) => {
        setOpenPopupId(prev => (prev === id ? null : id))
    }

    const handleCloseAllPlaces = () => {
        setOpenPopupId(null)
    }

    const openPlacePopupId = openPopupId ?? null

    return (
        <MapView
            places={places}
            events={events}
            isDark={theme === 'dark'}
            highlightIds={highlightIds}
            openPopupPlaceId={openPlacePopupId}
            onOpenPlace={handleOpenPlace}
            onCloseAllPlaces={handleCloseAllPlaces}
        />
    )
}
