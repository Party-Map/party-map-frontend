import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PlacesListPage } from "./PlacesListPage";

function renderPage(roles: Role[] = [Role.PLACE_MANAGER]) {
    return renderWithProviders(<PlacesListPage />, { route: "/admin/places/list", auth: authenticatedSnapshot(roles) });
}

describe("PlacesListPage", () => {
    it("is not found for users who do not manage places", async () => {
        mockApi({});
        renderPage([]);
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("lists the owned places, each linking to its admin page", async () => {
        mockApi({
            "GET /api/places/owned-places": [
                { id: place.id, name: place.name, address: place.address, city: place.city },
                { id: "p2", name: "No Address", address: "", city: "Siófok" },
            ],
        });
        renderPage();

        expect(await screen.findByRole("link", { name: place.name })).toHaveAttribute("href", "/admin/places/place-1");
        expect(screen.getByText(place.address)).toBeInTheDocument();
        expect(screen.getByText("—")).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 1, name: "My places" })).toBeInTheDocument();
    });

    it("explains an empty list", async () => {
        mockApi({ "GET /api/places/owned-places": [] });
        renderPage();
        expect(await screen.findByText("You do not manage any places yet. Add your first one.")).toBeInTheDocument();
    });

    it("offers a retry when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/places/owned-places": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText(/You do not manage any places yet/)).toBeInTheDocument();
    });
});
