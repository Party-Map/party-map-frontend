import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { event } from '@/test/fixtures'
import { authenticatedSnapshot, mockApi, renderWithProviders } from '@/test/helpers'
import { LikedListItem } from './LikedListItem'

type Overrides = Partial<Parameters<typeof LikedListItem>[0]>

function renderItem(overrides: Overrides = {}) {
  return renderWithProviders(
    <ul>
      <LikedListItem
        target="events"
        id="event-1"
        to="/events/event-1"
        title={event.title}
        image={event.image}
        meta="Tonight"
        kind="TECHNO"
        {...overrides}
      />
    </ul>,
    { auth: authenticatedSnapshot() },
  )
}

describe('LikedListItem', () => {
  it('shows the thumbnail, title link, secondary line, meta and kind badge', () => {
    renderItem({ secondary: 'Budapest' })

    expect(document.querySelector('img')).toHaveAttribute('src', event.image)
    expect(screen.getByRole('link', { name: event.title })).toHaveAttribute('href', '/events/event-1')
    expect(screen.getByText('Budapest')).toBeInTheDocument()
    expect(screen.getByText('Tonight')).toBeInTheDocument()
    expect(screen.getByText('Techno')).toBeInTheDocument()
  })

  it('omits the optional lines when they are not given', () => {
    renderItem({ secondary: undefined, meta: undefined, kind: undefined })

    expect(screen.getByRole('link', { name: event.title })).toBeInTheDocument()
    expect(screen.queryByText('Tonight')).not.toBeInTheDocument()
    expect(screen.queryByText('Techno')).not.toBeInTheDocument()
  })

  it('removes itself once unliked', async () => {
    mockApi({ 'DELETE /api/me/likes/events/event-1': { liked: false } })
    renderItem()

    await userEvent.click(await screen.findByRole('button', { name: 'Remove from favorites' }))

    await waitFor(() => expect(screen.queryByRole('listitem')).not.toBeInTheDocument())
  })

  it('stays when unliking fails', async () => {
    mockApi({ 'DELETE /api/me/likes/events/event-1': () => new Response('boom', { status: 500 }) })
    renderItem()

    await userEvent.click(await screen.findByRole('button', { name: 'Remove from favorites' }))

    expect(await screen.findByText('Could not update your likes. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument()
  })
})
