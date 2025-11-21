'use client'

import dynamic from 'next/dynamic'
import {useEffect, useState} from 'react'

import type {Event, Place} from '@/lib/types'
import {useTheme} from '@/components/ThemeProvider'
import {useHighlight} from "@/components/HighlightContextProvider";
import {useSearchParams} from "next/navigation";

const MapView = dynamic(() => import('@/app/map/MapView'), {ssr: false})

export default function MapClient({places, events}: {
    places: Place[];
    events: Event[]
}) {
    const focusParam = useSearchParams()
    const focus = focusParam.get("focus")
    const {theme} = useTheme()

    const {highlightIds, setHighlightIds} = useHighlight()
    const [openPopupId, setOpenPopupId] = useState<string | null>(null)

    useEffect(() => {
        if (focus) {
            setHighlightIds([focus])
        }
    }, [focus, setHighlightIds])

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
