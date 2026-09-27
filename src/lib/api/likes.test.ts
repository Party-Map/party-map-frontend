import type { Mock } from 'vitest'
import { fetchLikedEvents, fetchLikedPerformers, fetchLikedPlaces, fetchLikeStatus, like, unlike } from '@/lib/api/likes'
import { event, performer, place } from '@/test/fixtures'
import { mockApi, requestBody } from '@/test/helpers'

const BASE = 'http://api.test/api'

function sentRequests(fetchMock: Mock): string[] {
  return fetchMock.mock.calls.map((call) => {
    const [url, init] = call as [unknown, RequestInit | undefined]
    return `${init?.method ?? 'GET'} ${String(url)}`
  })
}

describe('likes api', () => {
  it('reads and toggles the like status of a target', async () => {
    const fetchMock = mockApi({
      'GET /api/me/likes/events/event-1': { liked: true },
      'PUT /api/me/likes/places/place-1': { liked: true },
      'DELETE /api/me/likes/performers/performer-1': { liked: false },
    })
    await expect(fetchLikeStatus('events', 'event-1')).resolves.toEqual({ liked: true })
    await expect(like('places', 'place-1')).resolves.toEqual({ liked: true })
    await expect(unlike('performers', 'performer-1')).resolves.toEqual({ liked: false })
    expect(sentRequests(fetchMock)).toEqual([
      `GET ${BASE}/me/likes/events/event-1`,
      `PUT ${BASE}/me/likes/places/place-1`,
      `DELETE ${BASE}/me/likes/performers/performer-1`,
    ])
    expect(requestBody(fetchMock, 1)).toBeUndefined()
    expect(requestBody(fetchMock, 2)).toBeUndefined()
  })

  it('lists liked events, places and performers', async () => {
    const grouped = { upcoming: [event], past: [] }
    const fetchMock = mockApi({
      'GET /api/events/liked-events': grouped,
      'GET /api/places/liked-places': [place],
      'GET /api/performers/liked-performers': [performer],
    })
    await expect(fetchLikedEvents()).resolves.toEqual(grouped)
    await expect(fetchLikedPlaces()).resolves.toEqual([place])
    await expect(fetchLikedPerformers()).resolves.toEqual([performer])
    expect(sentRequests(fetchMock)).toEqual([
      `GET ${BASE}/events/liked-events`,
      `GET ${BASE}/places/liked-places`,
      `GET ${BASE}/performers/liked-performers`,
    ])
  })
})
