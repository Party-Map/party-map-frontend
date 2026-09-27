import { search } from '@/lib/api/search'
import { searchHits } from '@/test/fixtures'
import { mockApi } from '@/test/helpers'

describe('search', () => {
  it('returns nothing for blank queries without touching the network', async () => {
    const fetchMock = mockApi({})
    await expect(search('')).resolves.toEqual([])
    await expect(search('   ')).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('trims and encodes the query and unwraps the hits', async () => {
    const fetchMock = mockApi({ 'GET /api/search?q=a38%20haj%C3%B3': { query: 'a38 hajó', hits: searchHits } })
    await expect(search('  a38 hajó ')).resolves.toEqual(searchHits)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://api.test/api/search?q=a38%20haj%C3%B3')
  })

  it('propagates API errors', async () => {
    mockApi({})
    await expect(search('nothing')).rejects.toMatchObject({ status: 404 })
  })
})
