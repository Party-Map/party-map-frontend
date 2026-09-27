import { screen } from '@testing-library/react'
import { LoggedOutPage } from '@/pages/LoggedOutPage'
import { authenticatedSnapshot, renderWithProviders } from '@/test/helpers'

describe('LoggedOutPage', () => {
  it('confirms the logout with a link home', async () => {
    renderWithProviders(<LoggedOutPage />, { route: '/logged-out', path: '/logged-out' })
    expect(await screen.findByRole('heading', { name: 'You are now logged out' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go back home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('main')).toHaveClass('main')
  })

  it('redirects home when the visitor is still signed in', async () => {
    renderWithProviders(<LoggedOutPage />, { route: '/logged-out', path: '/logged-out', auth: authenticatedSnapshot() })
    expect(await screen.findByText('other page')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'You are now logged out' })).toBeNull()
  })
})
