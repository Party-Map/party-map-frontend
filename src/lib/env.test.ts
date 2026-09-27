import { getEnv } from '@/lib/env'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getEnv', () => {
  it('reads the public configuration', () => {
    expect(getEnv()).toEqual({
      apiBaseUrl: 'http://api.test',
      keycloakUrl: 'http://kc.test',
      keycloakRealm: 'party-map',
      keycloakClientId: 'partymap-web',
    })
  })

  it('strips trailing slashes', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test///')
    vi.stubEnv('VITE_KEYCLOAK_URL', 'http://kc.test/')
    const env = getEnv()
    expect(env.apiBaseUrl).toBe('http://api.test')
    expect(env.keycloakUrl).toBe('http://kc.test')
  })

  it('throws naming the missing variable', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    expect(() => getEnv()).toThrow('Missing environment variable VITE_API_BASE_URL')
  })

  it.each(['VITE_KEYCLOAK_URL', 'VITE_KEYCLOAK_REALM', 'VITE_KEYCLOAK_CLIENT_ID'] as const)('requires %s', (name) => {
    vi.stubEnv(name, '')
    expect(() => getEnv()).toThrow(name)
  })
})
