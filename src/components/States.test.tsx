import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState, ErrorState, LoadingState } from '@/components/States'

describe('LoadingState', () => {
  it('announces a default label with a spinner', () => {
    const { container } = render(<LoadingState />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Loading…')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(container.querySelector('svg')).toHaveClass('spinner')
  })

  it('accepts a custom label', () => {
    render(<LoadingState label="Checking your session…" />)
    expect(screen.getByRole('status')).toHaveTextContent('Checking your session…')
  })
})

describe('ErrorState', () => {
  it('shows a default message without a retry button', () => {
    render(<ErrorState />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong.')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows a custom message and retries on demand', async () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Could not load." onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load.')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('EmptyState', () => {
  it('renders the message', () => {
    render(<EmptyState message="Nothing here yet." />)
    expect(screen.getByText('Nothing here yet.')).toHaveClass('empty')
  })
})
