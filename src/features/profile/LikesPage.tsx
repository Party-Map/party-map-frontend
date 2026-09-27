import { RequireAuth } from '@/components/auth/RequireAuth'
import { PageShell } from '@/components/PageShell'
import { LoadingState } from '@/components/States'
import { fetchLikedEvents, fetchLikedPerformers, fetchLikedPlaces } from '@/lib/api/likes'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useResource } from '@/lib/hooks/useResource'
import type { LikedEventsGrouped, Performer, Place } from '@/lib/types'
import { LikedTabs } from './LikedTabs'

type Likes = { events: LikedEventsGrouped; places: Place[]; performers: Performer[] }

const NO_EVENTS: LikedEventsGrouped = { upcoming: [], past: [] }

/** A list that fails to load shows as empty instead of breaking the whole page. */
async function orEmpty<T>(request: Promise<T>, empty: T, label: string): Promise<T> {
  try {
    return await request
  } catch (error) {
    console.error(`Could not load liked ${label}`, error)
    return empty
  }
}

function loadLikes(): Promise<Likes> {
  return Promise.all([
    orEmpty(fetchLikedEvents(), NO_EVENTS, 'events'),
    orEmpty(fetchLikedPlaces(), [], 'places'),
    orEmpty(fetchLikedPerformers(), [], 'performers'),
  ]).then(([events, places, performers]) => ({ events, places, performers }))
}

/** Everything the signed-in user has liked, grouped by kind. */
export function LikesPage() {
  const { status } = useAuth()
  const likes = useResource(loadLikes, [], { enabled: status === 'authenticated' })

  return (
    <RequireAuth message="You need to be signed in to view your likes.">
      <PageShell>
        <div className="stack">
          <h1 className="page-title">Your likes</h1>
          <p className="text-muted">View and manage the events, places and performers you’ve liked.</p>
          {likes.data ? <LikedTabs {...likes.data} /> : <LoadingState />}
        </div>
      </PageShell>
    </RequireAuth>
  )
}
