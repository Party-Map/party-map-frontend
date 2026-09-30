import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AuthSnapshot } from "@/lib/auth/keycloak";
import { Role } from "@/lib/auth/roles";
import type { PerformerListItem } from "@/lib/types";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { AdminPerformersPage } from "./AdminPerformersPage";

const manager = authenticatedSnapshot([Role.PERFORMER_MANAGER]);
const owned: PerformerListItem[] = [
    { id: "performer-1", name: "DJ Test" },
    { id: "performer-2", name: "Live Act" },
];

function renderPage(auth: AuthSnapshot = manager) {
    return renderWithProviders(<AdminPerformersPage />, {
        route: "/admin/performers",
        path: "/admin/performers",
        auth,
    });
}

describe("AdminPerformersPage", () => {
    it("sends anonymous visitors to login without loading anything", async () => {
        const fetchMock = mockApi({ "GET /api/performers/owned-performers": owned });
        const { client } = renderWithProviders(<AdminPerformersPage />, {
            route: "/admin/performers",
            path: "/admin/performers",
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/performers"));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows the 404 page to users without the performer manager role", async () => {
        mockApi({ "GET /api/performers/owned-performers": owned });
        renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        expect(screen.queryByText("Performers admin")).not.toBeInTheDocument();
    });

    it("shows a loading state while the list is fetched", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(() => new Promise<Response>(() => {})),
        );
        renderPage();
        expect(await screen.findByText("Loading…")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Performers admin" })).toBeInTheDocument();
    });

    it("shows an error with a retry action when the request fails", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/owned-performers": () => new Response("nope", { status: 500 }),
        });
        renderPage();
        expect(await screen.findByText("Could not load your performers.")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Try again" }));
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    });

    it("shows an empty state when the user owns no performers", async () => {
        mockApi({ "GET /api/performers/owned-performers": [] });
        renderPage();
        expect(await screen.findByText("You do not manage any performers yet.")).toBeInTheDocument();
    });

    it("lists the owned performers with a link to the detail page", async () => {
        mockApi({ "GET /api/performers/owned-performers": owned });
        renderPage();

        expect(await screen.findByText("DJ Test")).toBeInTheDocument();
        expect(screen.getByText("Live Act")).toBeInTheDocument();
        const links = screen.getAllByRole("link", { name: "View" });
        expect(links.map((link) => link.getAttribute("href"))).toEqual([
            "/admin/performers/performer-1",
            "/admin/performers/performer-2",
        ]);
        expect(screen.getByRole("link", { name: "Add new Performer" })).toHaveAttribute(
            "href",
            "/admin/performers/new",
        );
    });
});
