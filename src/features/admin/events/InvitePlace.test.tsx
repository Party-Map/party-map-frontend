import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { PlaceListItem } from '@/lib/types'
import { place, place2 } from '@/test/fixtures'
import { mockApi, renderWithProviders } from '@/test/helpers'
import { InvitePlace } from './InvitePlace'

const PLACES = 'GET /api/event-plan/places'
const INVITE = 'PUT /api/event-plan/plan-1/invite-place/place-1'
const places: PlaceListItem[] = [place, place2].map(({ id, name, address, city }) => ({ id, name, address, city }))

async function renderAndChoose(routes: Parameters<typeof mockApi>[0]) {
  const onChanged = vi.fn()
  const fetchMock = mockApi(routes)
  renderWithProviders(<InvitePlace planId="plan-1" onChanged={onChanged} />)
  const user = userEvent.setup()

  const select = screen.getByRole('combobox', { name: 'Place' })
  await waitFor(() => expect(select).toBeEnabled())
  await user.selectOptions(select, 'place-1')
  return { user, onChanged, fetchMock }
}

describe('InvitePlace', () => {
  it('lists the places and enables sending once one is chosen', async () => {
    mockApi({ [PLACES]: places })
    const onChanged = vi.fn()
    renderWithProviders(<InvitePlace planId="plan-1" onChanged={onChanged} />)
    const user = userEvent.setup()

    const select = screen.getByRole('combobox', { name: 'Place' })
    const button = screen.getByRole('button', { name: 'Send Invitation' })
    expect(select).toBeDisabled()
    expect(button).toBeDisabled()

    await waitFor(() => expect(select).toBeEnabled())
    expect(screen.getByRole('option', { name: 'Choose place to invite' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'A38 Hajó — Budapest (Petőfi híd budai hídfő)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Dürer Kert — Budapest (Öböl utca 1)' })).toBeInTheDocument()
    expect(button).toBeDisabled()

    await user.selectOptions(select, 'place-2')
    expect(button).toBeEnabled()
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('sends the invitation and notifies the parent', async () => {
    const { user, onChanged, fetchMock } = await renderAndChoose({ [PLACES]: places, [INVITE]: null })

    await user.click(screen.getByRole('button', { name: 'Send Invitation' }))

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/event-plan/plan-1/invite-place/place-1',
      expect.objectContaining({ method: 'PUT' }),
    )
    expect(screen.getByText('Invitation sent.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Invitation' })).toBeEnabled()
  })

  it('shows an error toast when the invitation fails', async () => {
    const { user, onChanged } = await renderAndChoose({
      [PLACES]: places,
      [INVITE]: () => new Response('boom', { status: 500 }),
    })

    await user.click(screen.getByRole('button', { name: 'Send Invitation' }))

    expect(await screen.findByText('Could not send the invitation. Please try again.')).toBeInTheDocument()
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('shows an error when the places cannot be loaded', async () => {
    mockApi({ [PLACES]: () => new Response('boom', { status: 500 }) })
    renderWithProviders(<InvitePlace planId="plan-1" onChanged={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the places you can invite.')
    expect(screen.getByRole('combobox', { name: 'Place' })).toBeEnabled()
    expect(screen.queryByRole('option', { name: /A38/ })).not.toBeInTheDocument()
  })
})
