'use client'
import dynamic from 'next/dynamic'
import type { Place, Event } from '@/lib/types'
import { useTheme } from './ThemeProvider'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { HighlighterImpl } from '@/lib/map/Highlighter'
import { PopupControllerImpl } from '@/lib/map/PopupController'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function MapClient({ places, events }: { places: Place[]; events: Event[] }) {
  const { theme } = useTheme()
  const [highlightIds, setHighlightIds] = useState<string[] | undefined>()
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null)
  const [activePlaceIds, setActivePlaceIds] = useState<string[] | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const highlighterRef = useRef(new HighlighterImpl())
  const popupRef = useRef(new PopupControllerImpl())

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as unknown as CustomEvent<{ placeIds: string[] }>
      setHighlightIds(ce.detail.placeIds)
      if (ce.detail.placeIds.length === 0) { setActivePlaceId(null); setActivePlaceIds(null) }
    }
    window.addEventListener('pm:highlight-places', handler as any)
    return () => window.removeEventListener('pm:highlight-places', handler as any)
  }, [])

  useEffect(() => {
    const openHandler = (e: Event) => {
      const ce = e as unknown as CustomEvent<{ placeId: string }>
      setActivePlaceId(ce.detail.placeId)
      setActivePlaceIds(null)
    }
    const closeHandler = () => { setActivePlaceId(null); setActivePlaceIds(null) }
    window.addEventListener('pm:open-place-popup', openHandler as any)
    window.addEventListener('pm:close-popups', closeHandler as any)
    return () => {
      window.removeEventListener('pm:open-place-popup', openHandler as any)
      window.removeEventListener('pm:close-popups', closeHandler as any)
    }
  }, [])

  useEffect(() => {
    const focus = searchParams?.get('focus')
    if (focus) {
      highlighterRef.current.set([focus])
      popupRef.current.open(focus)
      const url = new URL(window.location.href)
      url.searchParams.delete('focus')
      router.replace(url.pathname + url.search + url.hash, { scroll: false })
    }
  }, [searchParams, router])


  return <MapView places={places} events={events} isDark={theme === 'dark'} highlightIds={highlightIds} activePlaceId={activePlaceId} activePlaceIds={activePlaceIds ?? undefined} />
}
