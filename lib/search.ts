import type { SearchHit, Event, Performer, Place } from './types'

const norm = (s: string) => s.toLowerCase().normalize('NFKD')
const includes = (text: string, q: string) => norm(text).includes(norm(q))

export interface SearchDataBuckets {
  places: Place[]
  events: Event[]
  performers: Performer[]
}

/**
Has to normalize text (norm)

Has to check substring matches across many fields

Has to prebuild groupings (eventsByPlace, eventsByPerformer)

Has to sort events by start time

Has to decide what counts as upcoming

Has to search tags

Has to assemble place/event/performer hits

Has to construct SearchHit[] manually

Has to sort results by relevance

Has to slice to top 20

Has to do all of that in the browser every time the user types
 */
// TODO: move logic to backend
export function buildSearchHits(query: string, data: SearchDataBuckets): SearchHit[] {
  const q = query.trim()
  if (!q) return []
  const { places, events, performers } = data
  const now = Date.now()

  // Precompute upcoming events per place and performer
  const eventsByPlace = new Map<string, Event[]>()
  const eventsByPerformer = new Map<string, Event[]>()
  for (const ev of events) {
    if (new Date(ev.end).getTime() < now) continue // past
    if (!eventsByPlace.has(ev.placeId)) eventsByPlace.set(ev.placeId, [])
    eventsByPlace.get(ev.placeId)!.push(ev)
    for (const perfId of ev.performerIds) {
      if (!eventsByPerformer.has(perfId)) eventsByPerformer.set(perfId, [])
      eventsByPerformer.get(perfId)!.push(ev)
    }
  }
  const pickSoonest = (arr?: Event[]) => arr && arr.length ? arr.slice().sort((a,b)=> new Date(a.start).getTime()-new Date(b.start).getTime())[0] : undefined

  const placeHits: SearchHit[] = places
    .filter(p =>
      includes(p.name, q) ||
      includes(p.city, q) ||
      includes(p.address, q) ||
      p.tags.some(t => includes(t, q))
    )
    .map(p => {
      const next = pickSoonest(eventsByPlace.get(p.id))
      return {
        type: 'place' as const,
        id: p.id,
        title: p.name,
        subtitle: `${p.city} • ${p.tags.join(', ')}`,
        href: `/places/${p.id}`,
        image: p.image,
        placeId: p.id,
        nextEventStart: next?.start,
      }
    })

  const eventHits: SearchHit[] = events
    .filter(e => {
      const place = places.find(p => p.id === e.placeId)
      const blob = `${e.title} ${e.description} ${place?.name ?? ''} ${place?.city ?? ''}`
      return includes(blob, q)
    })
    .map(e => {
      const place = places.find(p => p.id === e.placeId)
      return {
        type: 'event' as const,
        id: e.id,
        title: e.title,
        subtitle: place ? `${place.name} • ${place.city}` : 'Event',
        href: `/events/${e.id}`,
        image: e.image,
        placeId: e.placeId,
        nextEventStart: e.start,
      }
    })

  const performerHits: SearchHit[] = performers
    .filter(a => includes(a.name, q) || includes(a.genre, q))
    .map(a => {
      const next = pickSoonest(eventsByPerformer.get(a.id))
      return {
        type: 'performer' as const,
        id: a.id,
        title: a.name,
        subtitle: a.genre,
        href: `/performers/${a.id}`,
        image: a.image,
        nextEventStart: next?.start,
      }
    })

  // Tag hits (unique tags across places)
  const uniqueTags = Array.from(new Set(places.flatMap(p => p.tags)))
  const tagHits: SearchHit[] = uniqueTags
    .filter(tag => includes(tag, q))
    .slice(0, 10)
    .map(tag => ({
      type: 'tag' as const,
      id: tag,
      title: `#${tag}`,
      subtitle: 'Tag',
      href: `/404`,
      image: '/placeholder.svg',
    }))

  const starts = (s: string) => norm(s).startsWith(norm(q)) ? 0 : 1

  return [...tagHits, ...placeHits, ...eventHits, ...performerHits]
    .sort((a, b) => starts(a.title) - starts(b.title))
    .slice(0, 20)
}
