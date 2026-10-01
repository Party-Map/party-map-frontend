import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from "@/test/helpers";
import { fakeMap } from "@/test/mocks/leaflet";

import { EditPlacePage } from "./EditPlacePage";

vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

function renderPage(auth = authenticatedSnapshot([Role.PLACE_MANAGER])) {
    return renderWithProviders(<EditPlacePage />, {
        route: "/admin/places/place-1/edit",
        path: "/admin/places/:id/edit",
        auth,
        dataRouter: true,
    });
}

describe("EditPlacePage", () => {
    beforeEach(() => fakeMap.reset());

    it("sends anonymous visitors to login without loading anything", async () => {
        const fetchMock = mockApi({});
        const { client } = renderWithProviders(<EditPlacePage />, {
            route: "/admin/places/place-1/edit",
            path: "/admin/places/:id/edit",
            dataRouter: true,
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/places/place-1/edit"));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows the 404 page to other roles and for an unknown place", async () => {
        mockApi({});
        const { unmount } = renderPage(authenticatedSnapshot([Role.PERFORMER_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        unmount();
        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows an error with a retry action when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/places/place-1": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : place;
            },
        });
        renderPage();

        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: "Details" })).toBeInTheDocument();
    });

    it("opens any step of the prefilled place and saves the change without leaving", async () => {
        const fetchMock = mockApi({ "GET /api/places/place-1": place, "PUT /api/places/place-1": place });
        renderPage();

        expect(await screen.findByRole("heading", { level: 1, name: "Details" })).toBeInTheDocument();
        const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
        expect(within(crumbs).getByRole("link", { name: place.name })).toHaveAttribute("href", "/admin/places/place-1");
        const publicLink = screen.getByRole("link", { name: /View public page/ });
        expect(publicLink).toHaveAttribute("href", "/places/place-1");
        expect(publicLink).toHaveAttribute("target", "_blank");
        expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/admin/places/place-1");

        const steps = screen.getByRole("navigation", { name: "Form steps" });
        await userEvent.click(within(steps).getByRole("button", { name: /Image & links/ }));
        expect(screen.getByLabelText("Cover image URL")).toHaveValue(place.image);
        await userEvent.click(within(steps).getByRole("button", { name: /Basics/ }));
        await userEvent.clear(screen.getByLabelText("Name"));
        await userEvent.type(screen.getByLabelText("Name"), "A38 Ship");
        await userEvent.click(within(steps).getByRole("button", { name: /Review/ }));
        await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

        expect(await screen.findByText("Place saved.")).toBeInTheDocument();
        const put = fetchMock.requests.findIndex((r) => r.method === "PUT");
        expect(requestBody(fetchMock, put)).toMatchObject({ name: "A38 Ship", tags: place.tags, links: place.links });
        expect(screen.queryByText("other page")).not.toBeInTheDocument();
    });
});
