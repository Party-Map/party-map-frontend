import { createBrowserRouter, type RouteObject } from 'react-router'
import { RootLayout } from '@/app/RootLayout'
import { adminRoutes } from '@/features/admin/routes'
import { EventPage } from '@/features/events'
import { MapPage } from '@/features/map'
import { PerformerPage } from '@/features/performers'
import { PlacePage } from '@/features/places'
import { LikesPage, ProfilePage } from '@/features/profile'
import { ErrorPage } from '@/pages/ErrorPage'
import { LoggedOutPage } from '@/pages/LoggedOutPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Route table. Pages that need a signed-in user or an admin role guard themselves
 * (RequireAuth / RequireRole), so the table stays a plain map of paths to pages.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <MapPage /> },
      { path: 'places/:id', element: <PlacePage /> },
      { path: 'events/:id', element: <EventPage /> },
      { path: 'performers/:id', element: <PerformerPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/likes', element: <LikesPage /> },
      adminRoutes,
      { path: 'logged-out', element: <LoggedOutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
