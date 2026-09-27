vi.mock('react-leaflet', () => import('@/test/mocks/leaflet').then((m) => m.reactLeafletMock))
vi.mock('leaflet', () => import('@/test/mocks/leaflet').then((m) => m.leafletMock))

import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { useHighlight } from '@/app/HighlightProvider'
import { TILE_URL } from '@/lib/constants'
import type { ID } from '@/lib/types'
import { place, place2, upcoming } from '@/test/fixtures'
import { mockApi, renderWithProviders } from '@/test/helpers'
import { fakeMap, reactLeafletMock } from '@/test/mocks/leaflet'
import { MapPage } from './MapPage'

const ROUTES = {
  'GET /api/places': [place, place2],
  'GET /api/events/upcoming-events': [upcoming],
}

/** Test-only way to change the highlights the way the search bar would. */
function HighlightSetter({ ids }: { ids: ID[] }) {
  const { setHighlightIds } = useHighlight()
  return (
    <button type="button" onClick={() => setHighlightIds(ids)}>
      set highlights
    </button>
  )
}

function pin(index: number): HTMLElement {
  const el = screen.getAllByTestId('marker')[index]
  if (!el) throw new Error(`no marker at ${index}`)
  return el
}

async function renderLoaded(route = '/') {
  mockApi(ROUTES)
  const view = renderWithProviders(
    <>
      <MapPage />
      <HighlightSetter ids={[place2.id]} />
    </>,
    { route },
  )
  await screen.findAllByTestId('marker')
  return view
}

beforeEach(() => fakeMap.reset())

describe('MapPage', () => {
  it('shows a loading state over an empty map', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    )
    renderWithProviders(<MapPage />)
    expect(await screen.findByRole('status')).toHaveTextContent('Loading map…')
    expect(screen.getByTestId('map')).toBeInTheDocument()
    expect(screen.queryAllByTestId('marker')).toHaveLength(0)
  })

  it('shows an error with retry when loading fails, then renders the map', async () => {
    let attempts = 0
    mockApi({
      ...ROUTES,
      'GET /api/places': () => {
        attempts += 1
        return attempts === 1 ? new Response('nope', { status: 500 }) : [place, place2]
      },
    })
    renderWithProviders(<MapPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the map.')
    expect(screen.queryAllByTestId('marker')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findAllByTestId('marker')).toHaveLength(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders the OpenStreetMap tiles and a pin and a label per place', async () => {
    await renderLoaded()
    expect(screen.getAllByTestId('marker')).toHaveLength(2)
    expect(screen.getByTestId('tile-layer')).toHaveAttribute('data-url', TILE_URL)
    expect(screen.getByText(upcoming.title)).toBeInTheDocument()
    expect(screen.getByText(place2.name)).toBeInTheDocument()
    expect(fakeMap.flyTo).not.toHaveBeenCalled()
  })

  it('toggles the popup from its pin and closes it from the card or the map', async () => {
    await renderLoaded()
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()

    fireEvent.click(pin(0))
    expect(screen.getByTestId('popup')).toHaveTextContent(upcoming.title)
    fireEvent.click(pin(0))
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()

    fireEvent.click(pin(1))
    expect(screen.getByTestId('popup')).toHaveTextContent(place2.name)
    fireEvent.click(pin(0))
    expect(screen.getByTestId('popup')).toHaveTextContent(upcoming.title)

    fireEvent.click(screen.getByRole('button', { name: 'Close popup' }))
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()

    fireEvent.click(pin(0))
    act(() => {
      reactLeafletMock.fireMapEvent('click')
    })
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
  })

  it('closes the popup when the highlights change and flies to the new ones', async () => {
    await renderLoaded()
    fireEvent.click(pin(0))
    expect(screen.getByTestId('popup')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'set highlights' }))
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
    expect(fakeMap.flyTo).toHaveBeenCalledWith([place2.location.latitude, place2.location.longitude], 15, { duration: 0.6 })

    // Popups open again under the new highlights.
    fireEvent.click(pin(0))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('highlights the place from ?focus and flies to it', async () => {
    await renderLoaded(`/?focus=${place.id}`)
    await waitFor(() =>
      expect(fakeMap.flyTo).toHaveBeenCalledWith([place.location.latitude, place.location.longitude], 15, { duration: 0.6 }),
    )
  })
})
