'use client'

import dynamic from 'next/dynamic'
import {useContext, useEffect, useState} from 'react'

import type {Event, Place, PlaceUpcomingEvent} from '@/lib/types'
import {useTheme} from '@/components/ThemeProvider'
import {useHighlight} from "@/components/HighlightContextProvider";
import {useSearchParams} from "next/navigation";
import {fetchUpcomingEventByPlaceId} from "@/lib/api/places";
import {SessionContext} from "@/lib/auth/session-provider";

const MapView = dynamic(() => import('@/app/map/MapView'), {ssr: false})

export default function MapClient({places, events}: {
    places: Place[];
    events: Event[]
}) {
    const session = useContext(SessionContext)
    const focusParam = useSearchParams()
    const focus = focusParam.get("focus")
    const {theme} = useTheme()

    const {highlightIds, setHighlightIds} = useHighlight()
    const [openPopupId, setOpenPopupId] = useState<string | null>(null)
    const [openPopupUpcomingEvent, setOpenPopupUpcomingEvent] = useState<PlaceUpcomingEvent | null>(null)

    useEffect(() => {
        if (focus) {
            setHighlightIds([focus])
        }
    }, [focus, setHighlightIds])

    useEffect(() => {
        setOpenPopupId(null)
        setOpenPopupUpcomingEvent(null)
    }, [highlightIds])

    useEffect(() => {
        if (!openPopupId) {
            setOpenPopupUpcomingEvent(null)
            return
        }

        let active = true
        ;(async () => {
            try {
                const upcoming = await fetchUpcomingEventByPlaceId(openPopupId, session)
                if (!active) return
                setOpenPopupUpcomingEvent(upcoming)
            } catch {
                if (active) setOpenPopupUpcomingEvent(null)
            }
        })()

        return () => {
            active = false
        }
    }, [openPopupId])

    const handleOpenPlace = (id: string) => {
        setOpenPopupId(prev => (prev === id ? null : id))
    }

    const handleCloseAllPlaces = () => {
        setOpenPopupId(null)
        setOpenPopupUpcomingEvent(null)
    }

    const openPlacePopupId = openPopupId ?? null

    return (
        <MapView
            places={places}
            events={events}
            isDark={theme === 'dark'}
            highlightIds={highlightIds}
            openPopupPlaceId={openPlacePopupId}
            openPopupUpcomingEvent={openPopupUpcomingEvent}
            onOpenPlace={handleOpenPlace}
            onCloseAllPlaces={handleCloseAllPlaces}
        />
    )
}
