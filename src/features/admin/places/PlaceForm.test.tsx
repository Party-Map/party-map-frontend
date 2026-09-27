import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, Route, Routes } from 'react-router'
import { place } from '@/test/fixtures'
import { mockApi, renderWithProviders } from '@/test/helpers'
import { fakeMap, reactLeafletMock } from '@/test/mocks/leaflet'
import { PlaceForm } from './PlaceForm'

vi.mock('react-leaflet', () => import('@/test/mocks/leaflet').then((m) => m.reactLeafletMock))
vi.mock('leaflet', () => import('@/test/mocks/leaflet').then((m) => m.leafletMock))

const searchAnswer = [
  {
    display_name: 'Váci utca 5, Budapest, Hungary',
    lat: '47.4930',
    lon: '19.0520',
    address: { road: 'Váci utca', house_number: '5', postcode: '1052', city: 'Budapest' },
  },
  { display_name: 'Margitsziget, Hungary', lat: '47.5280', lon: '19.0480' },
]

function clickMap(lat: number, lng: number) {
  act(() => {
    reactLeafletMock.fireMapEvent('click', { latlng: { lat, lng } })
  })
}

describe('PlaceForm', () => {
  beforeEach(() => fakeMap.reset())

  it('refuses to submit without a location', async () => {
    mockApi({})
    const onSubmit = vi.fn(async () => {})
    renderWithProviders(<PlaceForm title="Create a new place" submitLabel="Create place" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Bar')
    await userEvent.type(screen.getByLabelText('City'), 'Budapest')
    await userEvent.click(screen.getByRole('button', { name: 'Create place' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Please pick a location on the map.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a prefilled place unchanged, without links when there are none', async () => {
    mockApi({})
    const onSubmit = vi.fn(async () => {})
    const { links: _links, ...withoutLinks } = place
    renderWithProviders(<PlaceForm title="Edit place" submitLabel="Save changes" initialValues={withoutLinks} onSubmit={onSubmit} />)

    await userEvent.clear(screen.getByLabelText('Cover image URL'))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      name: place.name,
      address: place.address,
      city: place.city,
      location: place.location,
      description: place.description,
      tags: place.tags,
      image: null,
    })
  })

  it('shows the busy state while saving and an error when saving fails', async () => {
    mockApi({})
    let reject: (reason: Error) => void = () => {}
    const onSubmit = vi.fn(() => new Promise<void>((_, rej) => (reject = rej)))
    renderWithProviders(<PlaceForm title="Edit place" submitLabel="Save changes" initialValues={place} onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

    act(() => reject(new Error('boom')))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save place. Please try again.')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
  })

  it('fills address, city and location from a picked search result', async () => {
    mockApi({ 'GET /search': searchAnswer })
    renderWithProviders(<PlaceForm title="Create a new place" submitLabel="Create place" onSubmit={async () => {}} />)

    await userEvent.type(screen.getByLabelText('Address'), 'Váci')
    await userEvent.click(await screen.findByRole('option', { name: 'Váci utca 5, 1052, Budapest' }))

    expect(screen.getByLabelText('Address')).toHaveValue('Váci utca 5, 1052, Budapest')
    expect(screen.getByLabelText('City')).toHaveValue('Budapest')
    expect(screen.getByText('Lat: 47.49300 · Lng: 19.05200')).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(fakeMap.setView).toHaveBeenLastCalledWith([47.493, 19.052], 13)
  })

  it('falls back to the display name and keeps the city when a picked result has no address details', async () => {
    mockApi({ 'GET /search': searchAnswer })
    renderWithProviders(<PlaceForm title="Edit place" submitLabel="Save changes" initialValues={place} onSubmit={async () => {}} />)

    await userEvent.clear(screen.getByLabelText('Address'))
    await userEvent.type(screen.getByLabelText('Address'), 'Margit')
    await userEvent.click(await screen.findByRole('option', { name: 'Margitsziget, Hungary' }))

    expect(screen.getByLabelText('Address')).toHaveValue('Margitsziget, Hungary')
    expect(screen.getByLabelText('City')).toHaveValue(place.city)
    expect(screen.getByText('Lat: 47.52800 · Lng: 19.04800')).toBeInTheDocument()
  })

  it('sets the location from a map click and reverse-geocodes the address', async () => {
    mockApi({
      'GET /reverse': { display_name: 'Somewhere', address: { road: 'Kazinczy utca', house_number: '14', suburb: 'Erzsébetváros' } },
    })
    renderWithProviders(<PlaceForm title="Create a new place" submitLabel="Create place" onSubmit={async () => {}} />)

    clickMap(47.4979, 19.0402)

    expect(screen.getByText('Lat: 47.49790 · Lng: 19.04020')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Kazinczy utca 14')).toBeInTheDocument()
    expect(screen.getByLabelText('City')).toHaveValue('Erzsébetváros')
  })

  it('keeps the typed address when the reverse lookup has no result, no details or fails', async () => {
    const fetchMock = mockApi({ 'GET /reverse': () => new Response('rate limited', { status: 429 }) })
    renderWithProviders(<PlaceForm title="Create a new place" submitLabel="Create place" initialValues={place} onSubmit={async () => {}} />)

    clickMap(47.5, 19.05)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Lat: 47.50000 · Lng: 19.05000')).toBeInTheDocument()
    expect(screen.getByLabelText('Address')).toHaveValue(place.address)

    const noDetails = mockApi({ 'GET /reverse': {} })
    clickMap(47.52, 19.07)
    await waitFor(() => expect(noDetails).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Lat: 47.52000 · Lng: 19.07000')).toBeInTheDocument()
    expect(screen.getByLabelText('Address')).toHaveValue(place.address)
    expect(screen.getByLabelText('City')).toHaveValue(place.city)

    const offline = vi.fn(() => Promise.reject(new Error('offline')))
    vi.stubGlobal('fetch', offline)
    clickMap(47.51, 19.06)
    await waitFor(() => expect(offline).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Lat: 47.51000 · Lng: 19.06000')).toBeInTheDocument()
    expect(screen.getByLabelText('Address')).toHaveValue(place.address)
    expect(screen.getByLabelText('City')).toHaveValue(place.city)
  })

  it('goes back in history on cancel', async () => {
    mockApi({})
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Link to="/form">open form</Link>} />
        <Route path="/form" element={<PlaceForm title="Create a new place" submitLabel="Create place" onSubmit={async () => {}} />} />
      </Routes>,
      { route: '/' },
    )

    await userEvent.click(screen.getByRole('link', { name: 'open form' }))
    expect(await screen.findByRole('heading', { name: 'Create a new place' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByRole('link', { name: 'open form' })).toBeInTheDocument()
  })
})
