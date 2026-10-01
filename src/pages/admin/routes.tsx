import type { ComponentType } from "react";
import { Navigate, type RouteObject } from "react-router";

import { AdminIndexPage } from "./AdminIndexPage";
import { AdminShell } from "./shell/AdminShell";

/** A lazily loaded page: `page(() => import("…/XPage"), "XPage")`. */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K): RouteObject["lazy"] {
    return async () => ({ Component: (await load())[name] });
}

/**
 * The admin area (see `domains.ts` for the sidebar sections). Code-split: visitors who only browse the map never
 * download the admin pages. Static segments (`list`, `requests`, `new`) win over `:id`.
 */
export const adminRoutes: RouteObject = {
    path: "admin",
    element: <AdminShell />,
    children: [
        { index: true, element: <AdminIndexPage /> },

        { path: "places", lazy: page(() => import("./places/PlacesOverviewPage"), "PlacesOverviewPage") },
        { path: "places/list", lazy: page(() => import("./places/PlacesListPage"), "PlacesListPage") },
        { path: "places/requests", lazy: page(() => import("./places/PlaceRequestsPage"), "PlaceRequestsPage") },
        { path: "places/new", lazy: page(() => import("./places/NewPlacePage"), "NewPlacePage") },
        { path: "places/:id", lazy: page(() => import("./places/PlaceOverviewPage"), "PlaceOverviewPage") },
        {
            path: "places/:id/requests",
            lazy: page(() => import("./places/SinglePlaceRequestsPage"), "SinglePlaceRequestsPage"),
        },
        { path: "places/:id/edit", lazy: page(() => import("./places/EditPlacePage"), "EditPlacePage") },

        {
            path: "performers",
            lazy: page(() => import("./performers/PerformersOverviewPage"), "PerformersOverviewPage"),
        },
        { path: "performers/list", lazy: page(() => import("./performers/PerformersListPage"), "PerformersListPage") },
        {
            path: "performers/requests",
            lazy: page(() => import("./performers/PerformerRequestsPage"), "PerformerRequestsPage"),
        },
        { path: "performers/new", lazy: page(() => import("./performers/NewPerformerPage"), "NewPerformerPage") },
        {
            path: "performers/:id",
            lazy: page(() => import("./performers/PerformerOverviewPage"), "PerformerOverviewPage"),
        },
        {
            path: "performers/:id/requests",
            lazy: page(() => import("./performers/SinglePerformerRequestsPage"), "SinglePerformerRequestsPage"),
        },
        {
            path: "performers/:id/edit",
            lazy: page(() => import("./performers/EditPerformerPage"), "EditPerformerPage"),
        },

        { path: "events", lazy: page(() => import("./events/EventsOverviewPage"), "EventsOverviewPage") },
        { path: "events/plans", lazy: page(() => import("./events/EventPlansPage"), "EventPlansPage") },
        { path: "events/plans/new", lazy: page(() => import("./events/NewEventPlanPage"), "NewEventPlanPage") },
        { path: "events/plans/:id", lazy: page(() => import("./events/EventPlanPage"), "EventPlanPage") },
        { path: "events/plans/:id/edit", lazy: page(() => import("./events/EditEventPlanPage"), "EditEventPlanPage") },
        { path: "events/live", lazy: page(() => import("./events/LiveEventsPage"), "LiveEventsPage") },

        { path: "platform", element: <Navigate to="/admin/platform/users" replace /> },
        { path: "platform/users", lazy: page(() => import("./platform/UsersPage"), "UsersPage") },
        { path: "platform/users/:id", lazy: page(() => import("./platform/UserDetailPage"), "UserDetailPage") },

        { path: "*", lazy: page(() => import("@/pages/NotFoundPage"), "NotFoundPage") },
    ],
};
