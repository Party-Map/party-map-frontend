import type { RouteObject } from "react-router";

import { AdminLayout } from "@/layout/AdminLayout";

import { AdminIndexPage } from "./AdminIndexPage";

/**
 * The admin area is code-split: visitors who only browse the map never download the forms,
 * the address search or the lineup editor.
 */
export const adminRoutes: RouteObject = {
    path: "admin",
    element: <AdminLayout />,
    children: [
        { index: true, element: <AdminIndexPage /> },
        {
            path: "places",
            lazy: async () => ({ Component: (await import("@/pages/admin/places/AdminPlacesPage")).AdminPlacesPage }),
        },
        {
            path: "places/new",
            lazy: async () => ({ Component: (await import("@/pages/admin/places/NewPlacePage")).NewPlacePage }),
        },
        {
            path: "places/:id",
            lazy: async () => ({ Component: (await import("@/pages/admin/places/EditPlacePage")).EditPlacePage }),
        },
        {
            path: "performers",
            lazy: async () => ({
                Component: (await import("@/pages/admin/performers/AdminPerformersPage")).AdminPerformersPage,
            }),
        },
        {
            path: "performers/new",
            lazy: async () => ({
                Component: (await import("@/pages/admin/performers/NewPerformerPage")).NewPerformerPage,
            }),
        },
        {
            path: "performers/:id",
            lazy: async () => ({
                Component: (await import("@/pages/admin/performers/EditPerformerPage")).EditPerformerPage,
            }),
        },
        {
            path: "events",
            lazy: async () => ({ Component: (await import("@/pages/admin/events/AdminEventsPage")).AdminEventsPage }),
        },
        {
            path: "events/new",
            lazy: async () => ({ Component: (await import("@/pages/admin/events/NewEventPlanPage")).NewEventPlanPage }),
        },
        {
            path: "events/:id",
            lazy: async () => ({ Component: (await import("@/pages/admin/events/EventPlanPage")).EventPlanPage }),
        },
    ],
};
