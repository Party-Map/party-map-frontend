import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useHighlight } from '@/app/HighlightProvider'
import { BottomBar } from '@/components/BottomBar'
import { ErrorState, LoadingState } from '@/components/States'
import { TopBar } from '@/components/TopBar'
import { fetchUpcomingEventsByPlace } from '@/lib/api/events'
import { fetchPlaces } from '@/lib/api/places'
import { useResource } from '@/lib/hooks/useResource'
import type { ID, Place, UpcomingEventByPlace } from '@/lib/types'
import { MapView } from './MapView'
import styles from './MapPage.module.css'

const NO_PLACES: Place[] = []

/**
 * Which popup is open, remembered together with the highlight set it was opened under: a
 * change of highlights (search, focus) closes it without an effect.
 */
type PopupState = { id: ID; forHighlights: ID[] }

/** Home route: the full-screen map with every place and its next event. */
export function MapPage() {
  const [searchParams] = useSearchParams()
  const focus = searchParams.get('focus')
  const { highlightIds, setHighlightIds } = useHighlight()

  const placesResource = useResource(fetchPlaces, [])
  const upcomingResource = useResource(fetchUpcomingEventsByPlace, [])
  const [popup, setPopup] = useState<PopupState | null>(null)

  // Arriving with ?focus=<placeId> (from search on another page) highlights that place.
  useEffect(() => {
    if (focus) setHighlightIds([focus])
  }, [focus, setHighlightIds])

  const upcomingMap = useMemo(
    () => new Map<ID, UpcomingEventByPlace>((upcomingResource.data ?? []).map((u) => [u.placeId, u])),
    [upcomingResource.data],
  )

  const error = placesResource.error ?? upcomingResource.error
  const loading = placesResource.loading || upcomingResource.loading
  const places = !error && placesResource.data && upcomingResource.data ? placesResource.data : NO_PLACES

  const openPopupId = popup !== null && popup.forHighlights === highlightIds ? popup.id : null
  const togglePopup = (id: ID) => setPopup(openPopupId === id ? null : { id, forHighlights: highlightIds })
  const closePopup = useCallback(() => setPopup(null), [])

  const reload = () => {
    placesResource.reload()
    upcomingResource.reload()
  }

  return (
    <>
      <TopBar />
      <BottomBar />
      <main className={styles.main}>
        <MapView
          places={places}
          upcomingMap={upcomingMap}
          highlightIds={highlightIds}
          openPopupId={openPopupId}
          onOpenPlace={togglePopup}
          onClosePopup={closePopup}
        />
        {(loading || error) && (
          <div className={styles.overlay}>
            <div className={styles.overlayCard}>
              {error ? (
                <ErrorState message="Could not load the map." onRetry={reload} />
              ) : (
                <LoadingState label="Loading map…" />
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
