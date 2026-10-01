import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { AuthProvider } from "@/auth/provider";
import { HighlightProvider } from "@/layout/HighlightProvider";
import { LocationProvider } from "@/layout/LocationProvider";
import { browseEventsPage } from "@/test/fixtures";
import { createTestQueryClient } from "@/test/helpers";
import { createMockAuthClient, mockApi } from "@/test/helpers";

import { router, routes } from "./routes";

describe("route table", () => {
    it("mounts everything under the root layout with index, logged-out and catch-all routes", () => {
        expect(routes).toHaveLength(1);
        const root = routes[0];
        expect(root?.path).toBe("/");
        expect(root?.element).toBeDefined();
        expect(root?.errorElement).toBeDefined();
        const children = root?.children ?? [];
        expect(children.some((child) => child.index === true)).toBe(true);
        expect(children.map((child) => child.path)).toEqual(expect.arrayContaining(["logged-out", "*"]));
        expect(children.at(-1)?.path).toBe("*");
    });

    it("builds the browser router from the same table", () => {
        expect(router.routes).toHaveLength(1);
        expect(router.routes[0]?.path).toBe("/");
        expect(router.routes[0]?.children?.map((child) => child.path)).toEqual(
            routes[0]?.children?.map((child) => child.path),
        );
    });
});

describe("routes", () => {
    it("renders the logged-out page and falls back to the 404 page", async () => {
        mockApi({});
        const memoryRouter = createMemoryRouter(routes, { initialEntries: ["/logged-out"] });
        render(
            <AuthProvider client={createMockAuthClient()}>
                <QueryClientProvider client={createTestQueryClient()}>
                    <HighlightProvider>
                        <RouterProvider router={memoryRouter} />
                    </HighlightProvider>
                </QueryClientProvider>
            </AuthProvider>,
        );
        expect(await screen.findByRole("heading", { name: "You are now logged out" })).toBeInTheDocument();
        expect(screen.getByRole("dialog", { name: "Privacy & Cookies" })).toBeInTheDocument();

        await act(async () => {
            await memoryRouter.navigate("/does-not-exist");
        });
        expect(await screen.findByRole("heading", { name: "404" })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "You are now logged out" })).toBeNull();
    });

    it("sends /browse to the events list", async () => {
        mockApi({ "GET /api/browse/events": browseEventsPage });
        const memoryRouter = createMemoryRouter(routes, { initialEntries: ["/browse"] });
        render(
            <AuthProvider client={createMockAuthClient()}>
                <QueryClientProvider client={createTestQueryClient()}>
                    <HighlightProvider>
                        <LocationProvider>
                            <RouterProvider router={memoryRouter} />
                        </LocationProvider>
                    </HighlightProvider>
                </QueryClientProvider>
            </AuthProvider>,
        );
        expect(await screen.findByRole("list", { name: "Events" })).toBeInTheDocument();
        expect(memoryRouter.state.location.pathname).toBe("/browse/events");
        expect(screen.getByRole("link", { name: "Events" })).toHaveClass("active");
    });
});
