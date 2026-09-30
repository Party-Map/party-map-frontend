import type { RouteObject } from "react-router";

import { AdminIndexPage } from "./AdminIndexPage";
import { AdminLayout } from "./AdminLayout";

/**
 * The admin area is code-split: visitors who only browse the map never download the forms,
 * the address search or the lineup editor.
 */
export const adminRoutes: RouteObject = {
    path: "admin",
    element: <AdminLayout />,
    children: [
        { index: true, element: <AdminIndexPage /> },
        { path: "places", lazy: async () => ({ Component: (await import("./places")).AdminPlacesPage }) },
        { path: "places/new", lazy: async () => ({ Component: (await import("./places")).NewPlacePage }) },
        { path: "places/:id", lazy: async () => ({ Component: (await import("./places")).EditPlacePage }) },
        { path: "performers", lazy: async () => ({ Component: (await import("./performers")).AdminPerformersPage }) },
        { path: "performers/new", lazy: async () => ({ Component: (await import("./performers")).NewPerformerPage }) },
        { path: "performers/:id", lazy: async () => ({ Component: (await import("./performers")).EditPerformerPage }) },
        { path: "events", lazy: async () => ({ Component: (await import("./events")).AdminEventsPage }) },
        { path: "events/new", lazy: async () => ({ Component: (await import("./events")).NewEventPlanPage }) },
        { path: "events/:id", lazy: async () => ({ Component: (await import("./events")).EventPlanPage }) },
    ],
};
