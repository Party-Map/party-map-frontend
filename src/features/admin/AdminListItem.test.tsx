import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/helpers'
import { AdminListItem } from './AdminListItem'

describe('AdminListItem', () => {
  it('renders the title, detail lines and a link to the detail page', () => {
    renderWithProviders(
      <ul>
        <AdminListItem title="A38 Hajó" lines={['Petőfi híd, Budapest', 'ship']} to="/admin/places/place-1" />
      </ul>,
    )
    expect(screen.getByRole('listitem')).toHaveTextContent('A38 Hajó')
    expect(screen.getByText('Petőfi híd, Budapest')).toBeInTheDocument()
    expect(screen.getByText('ship')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/admin/places/place-1')
  })

  it('works without lines and with a custom link label', () => {
    renderWithProviders(
      <ul>
        <AdminListItem title="DJ Test" to="/admin/performers/performer-1" linkLabel="Edit" />
      </ul>,
    )
    expect(screen.getByText('DJ Test')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/admin/performers/performer-1')
    expect(screen.getAllByRole('paragraph')).toHaveLength(1)
  })
})
