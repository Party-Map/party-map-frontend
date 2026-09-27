import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { authenticatedSnapshot, renderWithProviders } from '@/test/helpers'

const secret = <p>secret content</p>

describe('RequireAuth', () => {
  it('shows a loading state while the session is checked', () => {
    renderWithProviders(<RequireAuth>{secret}</RequireAuth>, { authPending: true })
    expect(screen.getByRole('status')).toHaveTextContent('Checking your session…')
    expect(screen.queryByText('secret content')).toBeNull()
  })

  it('prompts anonymous visitors to sign in and returns them to the current URL', async () => {
    const { client } = renderWithProviders(<RequireAuth>{secret}</RequireAuth>, { route: '/profile/likes?tab=events' })
    expect(await screen.findByRole('heading', { name: 'Sign in required' })).toBeInTheDocument()
    expect(screen.getByText('You need to be signed in to view this page.')).toBeInTheDocument()
    expect(screen.queryByText('secret content')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Go to login' }))
    expect(client.login).toHaveBeenCalledWith('/profile/likes?tab=events')
  })

  it('passes a custom message to the prompt', async () => {
    renderWithProviders(<RequireAuth message="Members only.">{secret}</RequireAuth>)
    expect(await screen.findByText('Members only.')).toBeInTheDocument()
  })

  it('renders the children when signed in', async () => {
    renderWithProviders(<RequireAuth>{secret}</RequireAuth>, { auth: authenticatedSnapshot() })
    expect(await screen.findByText('secret content')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Sign in required' })).toBeNull()
  })
})
