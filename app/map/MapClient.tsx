'use client'

import dynamic from 'next/dynamic'
import {useEffect, useMemo, useRef, useState} from 'react'

import type {GeoPoint, Place, UpcomingEventByPlace} from '@/lib/types'
import {useTheme} from '@/components/ThemeProvider'
import {useHighlight} from '@/components/HighlightContextProvider'
import {useSearchParams} from 'next/navigation'

const MapView = dynamic(() => import('@/app/map/MapView'), {ssr: false})

export default function MapClient({
                                      places,
                                      upcomingMap,
                                  }: {
    places: Place[]
    upcomingMap: Map<string, UpcomingEventByPlace>
}) {
    const searchParams = useSearchParams()
    const focus = searchParams.get('focus')
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

    const popupPlace = useMemo(
        () =>
            openPopupId
                ? places.find(p => p.id === openPopupId) ?? null
                : null,
        [openPopupId, places],
    )

    const popupUpcomingEvent = useMemo(
        () =>
            popupPlace
                ? upcomingMap.get(popupPlace.id) ?? null
                : null,
        [popupPlace, upcomingMap],
    )
    const defaultMapCenter: GeoPoint = { // Budapest
        latitude: 47.4979,
        longitude: 19.0402,
    }
    const tileUrl =
        theme === 'dark'
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

    return (
        <MapView
            defaultMapCenter={defaultMapCenter}
            tileUrl={tileUrl}
            places={places}
            upcomingMap={upcomingMap}
            isDark={theme === 'dark'}
            highlightIds={highlightIds}
            openPopupPlaceId={openPopupId}
            popupPlace={popupPlace}
            popupUpcomingEvent={popupUpcomingEvent}
            onOpenPlace={handleOpenPlace}
            onCloseAllPlaces={handleCloseAllPlaces}
        />
    )
}
