'use client'

import dynamic from 'next/dynamic'
import {useEffect, useRef, useState} from 'react'

import type {Place, UpcomingEventByPlace} from '@/lib/types'
import {useTheme} from '@/components/ThemeProvider'
import {useHighlight} from "@/components/HighlightContextProvider";
import {useSearchParams} from "next/navigation";

const MapView = dynamic(() => import('@/app/map/MapView'), {ssr: false})

export default function MapClient({places, upcomingMap}: {
    places: Place[];
    upcomingMap: Map<string, UpcomingEventByPlace>
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

    const firstRender = useRef(true)
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false
            return
        }
        // Do not run on first render
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpenPopupId(null)
    }, [highlightIds])


    const handleOpenPlace = (id: string) => {
        setOpenPopupId(prev => (prev === id ? null : id))
    }

    const handleCloseAllPlaces = () => {
        setOpenPopupId(null)
    }

    return (
        <MapView
            places={places}
            upcomingMap={upcomingMap}
            isDark={theme === 'dark'}
            highlightIds={highlightIds}
            openPopupPlaceId={openPopupId}
            onOpenPlace={handleOpenPlace}
            onCloseAllPlaces={handleCloseAllPlaces}
        />
    )
}
