import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as ReactRouter from 'react-router'
import { vi } from 'vitest'
import { Role } from '@/lib/auth/roles'
import { eventPlan } from '@/test/fixtures'
import { authenticatedSnapshot, mockApi, renderWithProviders } from '@/test/helpers'
import { NewEventPlanPage } from './NewEventPlanPage'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactRouter>()),
  useNavigate: () => navigate,
}))

function renderPage(auth = authenticatedSnapshot([Role.EVENT_ORGANIZER])) {
  return renderWithProviders(<NewEventPlanPage />, { route: '/admin/events/new', path: '/admin/events/new', auth })
}

async function fillForm() {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Title'), '  Garden Party ')
  await user.selectOptions(screen.getByLabelText('Event kind'), 'TECHNO')
  fireEvent.change(screen.getByLabelText('Start'), { target: { value: '2030-07-01T18:00' } })
  fireEvent.change(screen.getByLabelText('End'), { target: { value: '2030-07-02T02:00' } })
  await user.type(screen.getByLabelText('Description'), 'Open air')
  await user.type(screen.getByLabelText('Price'), '1500')
  await user.type(screen.getByLabelText('Cover image URL'), 'https://images.example/garden.jpg')
  await user.click(screen.getByRole('button', { name: 'Create Event plan' }))
}

describe('NewEventPlanPage', () => {
  beforeEach(() => navigate.mockClear())

  it('shows a 404 to users without the organizer role', async () => {
    mockApi({})
    renderPage(authenticatedSnapshot([Role.PERFORMER_MANAGER]))
    expect(await screen.findByText('404')).toBeInTheDocument()
    expect(screen.queryByText('Create new Event plan')).not.toBeInTheDocument()
  })

  it('creates the plan and opens it', async () => {
    let body: unknown
    mockApi({
      'POST /api/event-plan': (init: RequestInit | undefined) => {
        body = JSON.parse(String(init?.body))
        return { ...eventPlan, id: 'plan-9' }
      },
    })
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Create new Event plan' })).toBeInTheDocument()
    await fillForm()

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin/events/plan-9'))
    expect(body).toEqual({
      title: 'Garden Party',
      kind: 'TECHNO',
      startDateTime: '2030-07-01T18:00',
      endDateTime: '2030-07-02T02:00',
      description: 'Open air',
      price: '1500',
      image: 'https://images.example/garden.jpg',
    })
    expect(screen.getByText('Event plan created.')).toBeInTheDocument()
  })

  it('shows an error when creating fails', async () => {
    mockApi({ 'POST /api/event-plan': () => new Response('boom', { status: 500 }) })
    renderPage()

    await fillForm()

    expect(await screen.findByText('Could not save the event plan. Please try again.')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Create Event plan' })).toBeEnabled()
  })
})
