import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Role } from '@/lib/auth/roles'
import { performer } from '@/test/fixtures'
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from '@/test/helpers'
import { NewPerformerPage } from './NewPerformerPage'

const manager = authenticatedSnapshot([Role.PERFORMER_MANAGER])

function renderPage(auth = manager) {
  return renderWithProviders(<NewPerformerPage />, { route: '/admin/performers/new', path: '/admin/performers/new', auth })
}

describe('NewPerformerPage', () => {
  it('sends anonymous visitors to login', async () => {
    const { client } = renderWithProviders(<NewPerformerPage />, { route: '/admin/performers/new', path: '/admin/performers/new' })
    await waitFor(() => expect(client.login).toHaveBeenCalledWith('/admin/performers/new'))
  })

  it('shows the 404 page to users without the performer manager role', async () => {
    renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]))
    expect(await screen.findByText('404')).toBeInTheDocument()
  })

  it('creates the performer from the form and opens its page', async () => {
    const fetchMock = mockApi({ 'POST /api/performers': { ...performer, id: 'performer-9' } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Create a new performer' })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Name'), ' DJ New ')
    await userEvent.type(screen.getByLabelText('Genre'), 'house')
    await userEvent.type(screen.getByLabelText('Bio'), 'Plays house.')
    await userEvent.click(screen.getByRole('button', { name: '+ Add link' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Instagram link' }), 'djnew')
    await userEvent.type(screen.getByLabelText('Profile image URL'), 'https://images.example/new.jpg')
    await userEvent.click(screen.getByRole('button', { name: 'Create performer' }))

    expect(await screen.findByText('other page')).toBeInTheDocument()
    expect(screen.getByText('Performer created.')).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://api.test/api/performers')
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.method).toBe('POST')
    expect(requestBody(fetchMock)).toEqual({
      name: 'DJ New',
      genre: 'house',
      bio: 'Plays house.',
      image: 'https://images.example/new.jpg',
      links: [{ type: 'INSTAGRAM', url: 'https://instagram.com/djnew' }],
    })
  })

  it('keeps the form with an error when the backend rejects the performer', async () => {
    mockApi({ 'POST /api/performers': () => new Response('bad request', { status: 400 }) })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Create a new performer' })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Name'), 'DJ New')
    await userEvent.type(screen.getByLabelText('Genre'), 'house')
    await userEvent.click(screen.getByRole('button', { name: 'Create performer' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save performer. Please try again.')
    expect(screen.queryByText('Performer created.')).not.toBeInTheDocument()
  })
})
