import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PlaceRequestsPage } from "./PlaceRequestsPage";

const owned = [{ id: place.id, name: place.name, address: place.address, city: place.city }];

function renderPage(roles: Role[] = [Role.PLACE_MANAGER]) {
    return renderWithProviders(<PlaceRequestsPage />, { auth: authenticatedSnapshot(roles) });
}

describe("PlaceRequestsPage", () => {
    it("is not found for users who do not manage places", async () => {
        mockApi({});
        renderPage([Role.PERFORMER_MANAGER]);
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("lists every request, pending first, and answers one", async () => {
        const fetchMock = mockApi({
            "GET /api/places/owned-places": owned,
            "GET /api/places/place-1/invitations": [
                {
                    eventPlanId: "plan-2",
                    title: "Old Party",
                    state: "REJECTED",
                    startDateTime: "2030-01-01T18:00:00",
                    endDateTime: "2030-01-01T23:00:00",
                },
                {
                    eventPlanId: "plan-1",
                    title: "Summer Opening",
                    state: "PENDING",
                    startDateTime: "2030-07-01T18:00:00",
                    endDateTime: "2030-07-02T02:00:00",
                },
            ],
            "PUT /api/places/place-1/invitations/plan-1/respond?state=reject": null,
        });
        renderPage();

        const titles = await screen.findAllByRole("heading", { level: 3 });
        expect(titles.map((title) => title.textContent)).toEqual(["Summer Opening", "Old Party"]);

        await userEvent.click(screen.getByRole("button", { name: "Reject Summer Opening for A38 Hajó" }));

        expect(await screen.findByText("Invitation rejected.")).toBeInTheDocument();
        expect(fetchMock.requests.find((r) => r.method === "PUT")?.url).toBe(
            "http://api.test/api/places/place-1/invitations/plan-1/respond?state=reject",
        );
    });

    it("explains when there are no requests", async () => {
        mockApi({ "GET /api/places/owned-places": owned, "GET /api/places/place-1/invitations": [] });
        renderPage();
        expect(await screen.findByText("No event organizer has asked for one of your places yet.")).toBeInTheDocument();
    });

    it("offers a retry when an invitation list fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/places/owned-places": owned,
            "GET /api/places/place-1/invitations": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText(/No event organizer has asked/)).toBeInTheDocument();
    });
});
