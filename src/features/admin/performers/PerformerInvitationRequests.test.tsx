import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatDateTimeRange } from '@/lib/dates'
import type { PerformerInvitationRequest } from '@/lib/types'
import { mockApi, renderWithProviders } from '@/test/helpers'
import { PerformerInvitationRequests } from './PerformerInvitationRequests'

const pending: PerformerInvitationRequest = {
  eventPlanId: 'plan-1',
  eventPlanTitle: 'Summer Opening',
  state: 'PENDING',
  startTime: '2030-07-01T22:00:00',
  endTime: '2030-07-02T00:00:00',
}
const accepted: PerformerInvitationRequest = { ...pending, eventPlanId: 'plan-2', state: 'ACCEPTED', eventPlanTitle: 'Accepted Night' }
const rejected: PerformerInvitationRequest = { ...pending, eventPlanId: 'plan-3', state: 'REJECTED', eventPlanTitle: 'Rejected Night' }

const buttonsOf = (title: string) => {
  const card = screen.getByRole('heading', { name: title }).closest('div[class*="requestCard"]')
  if (!card) throw new Error(`no card for ${title}`)
  return {
    accept: screen.getAllByRole('button', { name: 'Accept' }).find((b) => card.contains(b)),
    reject: screen.getAllByRole('button', { name: 'Reject' }).find((b) => card.contains(b)),
  }
}

describe('PerformerInvitationRequests', () => {
  it('shows an empty message without requests', () => {
    renderWithProviders(<PerformerInvitationRequests performerId="performer-1" requests={[]} onChanged={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Event requests' })).toBeInTheDocument()
    expect(screen.getByText('No event requests at the moment for this performer.')).toBeInTheDocument()
  })

  it('renders one card per request with its state, slot and the matching action disabled', () => {
    renderWithProviders(
      <PerformerInvitationRequests performerId="performer-1" requests={[pending, accepted, rejected]} onChanged={() => {}} />,
    )

    expect(screen.getByText('Summer Opening')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    expect(screen.getAllByText(formatDateTimeRange(pending.startTime, pending.endTime))).toHaveLength(3)
    expect(screen.getAllByText(/invited this performer to play at an event/)).toHaveLength(3)

    expect(buttonsOf('Summer Opening').accept).toBeEnabled()
    expect(buttonsOf('Summer Opening').reject).toBeEnabled()
    expect(buttonsOf('Accepted Night').accept).toBeDisabled()
    expect(buttonsOf('Accepted Night').reject).toBeEnabled()
    expect(buttonsOf('Rejected Night').accept).toBeEnabled()
    expect(buttonsOf('Rejected Night').reject).toBeDisabled()
  })

  it('accepts an invitation and asks the owner to reload', async () => {
    const fetchMock = mockApi({ 'PUT /api/performers/performer-1/invitations/plan-1/respond?state=accept': null })
    const onChanged = vi.fn()
    renderWithProviders(<PerformerInvitationRequests performerId="performer-1" requests={[pending]} onChanged={onChanged} />)

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }))

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://api.test/api/performers/performer-1/invitations/plan-1/respond?state=accept')
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.method).toBe('PUT')
    expect(screen.getByText('Invitation accepted.')).toBeInTheDocument()
  })

  it('rejects an invitation', async () => {
    const fetchMock = mockApi({ 'PUT /api/performers/performer-1/invitations/plan-1/respond?state=reject': null })
    const onChanged = vi.fn()
    renderWithProviders(<PerformerInvitationRequests performerId="performer-1" requests={[pending]} onChanged={onChanged} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/respond?state=reject')
    expect(screen.getByText('Invitation rejected.')).toBeInTheDocument()
  })

  it('disables both actions while the answer is being sent', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
    renderWithProviders(<PerformerInvitationRequests performerId="performer-1" requests={[pending]} onChanged={() => {}} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))

    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled()
  })

  it('reports a failed answer and keeps the list as it is', async () => {
    mockApi({ 'PUT /api/performers/performer-1/invitations/plan-1/respond?state=accept': () => new Response('nope', { status: 500 }) })
    const onChanged = vi.fn()
    renderWithProviders(<PerformerInvitationRequests performerId="performer-1" requests={[pending]} onChanged={onChanged} />)

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }))

    expect(await screen.findByText('Could not answer the invitation. Please try again.')).toBeInTheDocument()
    expect(onChanged).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled()
  })
})
