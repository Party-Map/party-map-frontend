import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { AuthProvider } from "@/auth/provider";
import { ADMIN_ROLES } from "@/auth/roles";
import { HighlightProvider } from "@/layout/HighlightProvider";
import { authenticatedSnapshot, createMockAuthClient, createTestQueryClient, mockApi } from "@/test/helpers";

import { ADMIN_DOMAINS } from "./domains";
import { adminRoutes } from "./routes";

function renderAt(path: string) {
    mockApi({});
    const router = createMemoryRouter([adminRoutes], { initialEntries: [path] });
    render(
        <AuthProvider client={createMockAuthClient(authenticatedSnapshot([...ADMIN_ROLES]))}>
            <QueryClientProvider client={createTestQueryClient()}>
                <HighlightProvider>
                    <RouterProvider router={router} />
                </HighlightProvider>
            </QueryClientProvider>
        </AuthProvider>,
    );
    return router;
}

const sections = ADMIN_DOMAINS.flatMap((domain) => domain.sections.map((section) => [section.to, section.label]));

describe("admin routes", () => {
    it.each(sections)("open the page of the sidebar section %s", async (to, label) => {
        renderAt(to);

        const heading = await screen.findByRole("heading", { level: 1 });
        // Overviews are titled by their domain, the other sections by their own label.
        const domain = ADMIN_DOMAINS.find((d) => d.sections.some((s) => s.to === to))!;
        expect([label, domain.label]).toContain(heading.textContent);
    });

    it("open the forms and send /admin and /admin/platform to their first page", async () => {
        const router = renderAt("/admin");
        expect(await screen.findByRole("heading", { level: 1, name: "Places" })).toBeInTheDocument();
        expect(router.state.location.pathname).toBe("/admin/places");

        await act(() => router.navigate("/admin/platform"));
        expect(await screen.findByRole("heading", { level: 1, name: "Users" })).toBeInTheDocument();
        expect(router.state.location.pathname).toBe("/admin/platform/users");

        await act(() => router.navigate("/admin/places/new"));
        expect(await screen.findByRole("heading", { level: 1, name: /new place/i })).toBeInTheDocument();
    });

    it("show the 404 page inside the shell for unknown admin paths", async () => {
        renderAt("/admin/nothing/here");

        expect(await screen.findByRole("heading", { name: "404" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
    });
});
