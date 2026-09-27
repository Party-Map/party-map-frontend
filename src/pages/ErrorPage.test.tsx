import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describeRouteError, ErrorPage } from '@/pages/ErrorPage'

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <p>home</p> },
          {
            path: 'boom',
            loader: () => {
              throw new Error('kaboom')
            },
            element: <p>never</p>,
          },
          {
            path: 'gone',
            loader: () => {
              throw new Response(null, { status: 404, statusText: 'Not Found' })
            },
            element: <p>never</p>,
          },
          {
            path: 'broken',
            loader: () => {
              throw new Response(null, { status: 503, statusText: 'Service Unavailable' })
            },
            element: <p>never</p>,
          },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

describe('describeRouteError', () => {
  it('describes route error responses, errors and anything else', () => {
    expect(describeRouteError({ status: 418, statusText: "I'm a teapot", internal: false, data: null })).toBe("418 I'm a teapot")
    expect(describeRouteError({ status: 500, statusText: '', internal: false, data: null })).toBe('500')
    expect(describeRouteError(new Error('nope'))).toBe('nope')
    expect(describeRouteError('string')).toBe('Unknown error')
    expect(describeRouteError(undefined)).toBe('Unknown error')
  })
})

describe('ErrorPage', () => {
  it('shows a recovery screen for unexpected errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderAt('/boom')
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toHaveClass('title')
    expect(screen.getByText('The page hit an unexpected error. Reloading usually fixes it.')).toHaveClass('text')
    expect(screen.getByText('kaboom')).toHaveClass('detail')
    expect(screen.getByRole('link', { name: 'Back to Map' })).toHaveAttribute('href', '/')
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })

  it('describes error responses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderAt('/broken')
    expect(await screen.findByText('503 Service Unavailable')).toHaveClass('detail')
  })

  it('shows the not-found page for 404 responses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderAt('/gone')
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Something went wrong' })).toBeNull()
  })

  it('renders nothing special when there is no error', async () => {
    renderAt('/')
    expect(await screen.findByText('home')).toBeInTheDocument()
  })
})
