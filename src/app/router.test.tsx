import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { HighlightProvider } from '@/app/HighlightProvider'
import { router, routes } from '@/app/router'
import { ThemeProvider } from '@/app/ThemeProvider'
import { ToastProvider } from '@/app/ToastProvider'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { createMockAuthClient, mockApi } from '@/test/helpers'

describe('route table', () => {
  it('mounts everything under the root layout with index, logged-out and catch-all routes', () => {
    expect(routes).toHaveLength(1)
    const root = routes[0]
    expect(root?.path).toBe('/')
    expect(root?.element).toBeDefined()
    expect(root?.errorElement).toBeDefined()
    const children = root?.children ?? []
    expect(children.some((child) => child.index === true)).toBe(true)
    expect(children.map((child) => child.path)).toEqual(expect.arrayContaining(['logged-out', '*']))
    expect(children.at(-1)?.path).toBe('*')
  })

  it('builds the browser router from the same table', () => {
    expect(router.routes).toHaveLength(1)
    expect(router.routes[0]?.path).toBe('/')
    expect(router.routes[0]?.children?.map((child) => child.path)).toEqual(routes[0]?.children?.map((child) => child.path))
  })
})

describe('routes', () => {
  it('renders the logged-out page and falls back to the 404 page', async () => {
    mockApi({})
    const memoryRouter = createMemoryRouter(routes, { initialEntries: ['/logged-out'] })
    render(
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider client={createMockAuthClient()}>
            <HighlightProvider>
              <RouterProvider router={memoryRouter} />
            </HighlightProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'You are now logged out' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Privacy & Cookies' })).toBeInTheDocument()

    await act(async () => {
      await memoryRouter.navigate('/does-not-exist')
    })
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'You are now logged out' })).toBeNull()
  })
})
