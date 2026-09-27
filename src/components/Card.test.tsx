import { render, screen } from '@testing-library/react'
import { Card, CardBody } from '@/components/Card'

describe('Card', () => {
  it('renders the surface without padding by default', () => {
    render(<Card data-testid="card">content</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveTextContent('content')
    expect(card).toHaveClass('card')
    expect(card).not.toHaveClass('padded')
  })

  it('adds padding and extra classes and forwards attributes', () => {
    render(
      <Card padded className="extra" role="region" aria-label="Details">
        content
      </Card>,
    )
    const card = screen.getByRole('region', { name: 'Details' })
    expect(card).toHaveClass('card', 'padded', 'extra')
  })
})

describe('CardBody', () => {
  it('renders a padded block', () => {
    render(
      <CardBody className="extra" data-testid="body">
        body
      </CardBody>,
    )
    const body = screen.getByTestId('body')
    expect(body).toHaveTextContent('body')
    expect(body).toHaveClass('padded', 'extra')
    expect(body).not.toHaveClass('card')
  })
})
