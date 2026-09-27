import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AuthSnapshot } from '@/lib/auth/keycloak'
import { Role } from '@/lib/auth/roles'
import type { PlaceListItem } from '@/lib/types'
import { authenticatedSnapshot, mockApi, renderWithProviders } from '@/test/helpers'
import { AdminPlacesPage } from './AdminPlacesPage'

const manager = authenticatedSnapshot([Role.PLACE_MANAGER])
const owned: PlaceListItem[] = [
  { id: 'place-1', name: 'A38 Hajó', address: 'Petőfi híd budai hídfő', city: 'Budapest' },
  { id: 'place-2', name: 'Dürer Kert', address: 'Öböl utca 1', city: 'Budapest' },
]

function renderPage(auth: AuthSnapshot = manager) {
  return renderWithProviders(<AdminPlacesPage />, { route: '/admin/places', path: '/admin/places', auth })
}

describe('AdminPlacesPage', () => {
  it('sends anonymous visitors to login without loading anything', async () => {
    const fetchMock = mockApi({ 'GET /api/places/owned-places': owned })
    const { client } = renderWithProviders(<AdminPlacesPage />, { route: '/admin/places', path: '/admin/places' })
    await waitFor(() => expect(client.login).toHaveBeenCalledWith('/admin/places'))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the 404 page to users without the place manager role', async () => {
    mockApi({ 'GET /api/places/owned-places': owned })
    renderPage(authenticatedSnapshot([Role.PERFORMER_MANAGER]))
    expect(await screen.findByText('404')).toBeInTheDocument()
    expect(screen.queryByText('Places admin')).not.toBeInTheDocument()
  })

  it('shows a loading state while the list is fetched', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
    renderPage()
    expect(await screen.findByText('Loading…')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Places admin' })).toBeInTheDocument()
  })

  it('shows an error with a retry action when the request fails', async () => {
    const fetchMock = mockApi({ 'GET /api/places/owned-places': () => new Response('nope', { status: 500 }) })
    renderPage()
    expect(await screen.findByText('Could not load your places.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('shows an empty state when the user owns no places', async () => {
    mockApi({ 'GET /api/places/owned-places': [] })
    renderPage()
    expect(await screen.findByText('You do not manage any places yet.')).toBeInTheDocument()
  })

  it('lists the owned places with their address and a link to the detail page', async () => {
    mockApi({ 'GET /api/places/owned-places': owned })
    renderPage()

    expect(await screen.findByText('A38 Hajó')).toBeInTheDocument()
    expect(screen.getByText('Petőfi híd budai hídfő, Budapest')).toBeInTheDocument()
    expect(screen.getByText('Dürer Kert')).toBeInTheDocument()
    expect(screen.getByText('Öböl utca 1, Budapest')).toBeInTheDocument()

    const links = screen.getAllByRole('link', { name: 'View' })
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/admin/places/place-1', '/admin/places/place-2'])
    expect(screen.getByRole('link', { name: 'Add new Place' })).toHaveAttribute('href', '/admin/places/new')
  })
})
