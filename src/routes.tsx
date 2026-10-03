import { createBrowserRouter, Navigate, type RouteObject } from "react-router";

import { RootLayout } from "@/layout/RootLayout";
import { adminRoutes } from "@/pages/admin/routes";
import { BrowsePage } from "@/pages/browse/BrowsePage";
import { EventsBrowsePage } from "@/pages/browse/EventsBrowsePage";
import { PerformersBrowsePage } from "@/pages/browse/PerformersBrowsePage";
import { PlacesBrowsePage } from "@/pages/browse/PlacesBrowsePage";
import { ErrorPage } from "@/pages/ErrorPage";
import { EventPage } from "@/pages/events/EventPage";
import { LoggedOutPage } from "@/pages/LoggedOutPage";
import { MapPage } from "@/pages/map/MapPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PerformerPage } from "@/pages/performers/PerformerPage";
import { PlacePage } from "@/pages/places/PlacePage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { LikesPage } from "@/pages/profile/LikesPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";

/**
 * Route table. Pages that need a signed-in user or an admin role guard themselves
 * (RequireAuth / RequireRole), so the table stays a plain map of paths to pages.
 */
export const routes: RouteObject[] = [
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <MapPage /> },
            { path: "places/:id", element: <PlacePage /> },
            { path: "events/:id", element: <EventPage /> },
            { path: "performers/:id", element: <PerformerPage /> },
            {
                path: "browse",
                element: <BrowsePage />,
                children: [
                    { index: true, element: <Navigate to="/browse/events" replace /> },
                    { path: "events", element: <EventsBrowsePage /> },
                    { path: "places", element: <PlacesBrowsePage /> },
                    { path: "performers", element: <PerformersBrowsePage /> },
                ],
            },
            { path: "profile", element: <ProfilePage /> },
            { path: "profile/likes", element: <LikesPage /> },
            adminRoutes,
            { path: "logged-out", element: <LoggedOutPage /> },
            { path: "privacy", element: <PrivacyPage /> },
            { path: "*", element: <NotFoundPage /> },
        ],
    },
];

export const router = createBrowserRouter(routes);
