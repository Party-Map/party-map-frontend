import type { Mock } from 'vitest'
import { api, ApiError, setTokenProvider } from '@/lib/api/client'
import { mockApi, requestBody } from '@/test/helpers'

type Sent = { url: string; method: string | undefined; headers: Record<string, string>; body: unknown }

function sent(fetchMock: Mock, index = 0): Sent {
  const call = fetchMock.mock.calls[index] as [unknown, RequestInit] | undefined
  if (!call) throw new Error(`fetch call ${index} is missing`)
  const [url, init] = call
  return { url: String(url), method: init.method, headers: (init.headers ?? {}) as Record<string, string>, body: init.body }
}

afterEach(() => {
  setTokenProvider(async () => null)
})

describe('api client', () => {
  it('builds the URL from the base URL and strips leading slashes', async () => {
    const fetchMock = mockApi({ 'GET /api/places': [] })
    await api.get('/places')
    await api.get('places')
    await api.get('///places')
    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toEqual([
      'http://api.test/api/places',
      'http://api.test/api/places',
      'http://api.test/api/places',
    ])
  })

  it('sends only an Accept header without a token', async () => {
    const fetchMock = mockApi({ 'GET /api/places': [] })
    await api.get('/places')
    const { method, headers, body } = sent(fetchMock)
    expect(method).toBe('GET')
    expect(headers).toEqual({ Accept: 'application/json' })
    expect(body).toBeUndefined()
  })

  it('adds a Bearer header from the token provider', async () => {
    setTokenProvider(async () => 'abc.def')
    const fetchMock = mockApi({ 'GET /api/me': {} })
    await api.get('/me')
    expect(sent(fetchMock).headers.Authorization).toBe('Bearer abc.def')
  })

  it('serialises JSON bodies for POST and PUT', async () => {
    const fetchMock = mockApi({ 'POST /api/places': { id: 'p1' }, 'PUT /api/places/p1': { id: 'p1', v: 2 } })
    await expect(api.post('/places', { name: 'A38' })).resolves.toEqual({ id: 'p1' })
    await expect(api.put('/places/p1', { name: 'A38' })).resolves.toEqual({ id: 'p1', v: 2 })
    const post = sent(fetchMock, 0)
    expect(post.method).toBe('POST')
    expect(post.headers['Content-Type']).toBe('application/json')
    expect(post.body).toBe('{"name":"A38"}')
    expect(requestBody(fetchMock, 0)).toEqual({ name: 'A38' })
    const put = sent(fetchMock, 1)
    expect(put.method).toBe('PUT')
    expect(put.headers['Content-Type']).toBe('application/json')
    expect(requestBody(fetchMock, 1)).toEqual({ name: 'A38' })
  })

  it('omits the body and Content-Type when no body is given', async () => {
    const fetchMock = mockApi({ 'POST /api/event-plan/1/publish': null, 'PUT /api/me/likes/events/1': null, 'DELETE /api/me/likes/events/1': null })
    await expect(api.post('/event-plan/1/publish')).resolves.toBeUndefined()
    await expect(api.put('/me/likes/events/1')).resolves.toBeUndefined()
    await expect(api.delete('/me/likes/events/1')).resolves.toBeUndefined()
    for (const index of [0, 1, 2]) {
      const call = sent(fetchMock, index)
      expect(call.body).toBeUndefined()
      expect(call.headers).not.toHaveProperty('Content-Type')
    }
    expect(sent(fetchMock, 0).method).toBe('POST')
    expect(sent(fetchMock, 1).method).toBe('PUT')
    expect(sent(fetchMock, 2).method).toBe('DELETE')
  })

  it('resolves undefined for a 204 and for an empty 200 body', async () => {
    mockApi({ 'DELETE /api/things/1': null, 'GET /api/empty': () => new Response('', { status: 200 }) })
    await expect(api.delete('/things/1')).resolves.toBeUndefined()
    await expect(api.get('/empty')).resolves.toBeUndefined()
  })

  it('throws an ApiError carrying the status for non-2xx answers', async () => {
    mockApi({ 'GET /api/places/p1': () => new Response('gone', { status: 410 }) })
    const error = await api.get('/places/p1').then(
      () => null,
      (e: unknown) => e,
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toBeInstanceOf(Error)
    expect(error).toMatchObject({ name: 'ApiError', status: 410, message: 'GET /api/places/p1 failed with 410' })
  })

  it('reports unknown routes as 404', async () => {
    mockApi({})
    await expect(api.get('/missing')).rejects.toMatchObject({ status: 404 })
  })
})
