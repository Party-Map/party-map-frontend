import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { SinglePlaceRequestsPage } from "./SinglePlaceRequestsPage";

function renderPage(auth = authenticatedSnapshot([Role.PLACE_MANAGER])) {
    return renderWithProviders(<SinglePlaceRequestsPage />, {
        route: "/admin/places/place-1/requests",
        path: "/admin/places/:id/requests",
        auth,
    });
}

describe("SinglePlaceRequestsPage", () => {
    it("shows the 404 page to other roles and for an unknown place", async () => {
        mockApi({ "GET /api/places/place-1/invitations": [] });
        const { unmount } = renderPage(authenticatedSnapshot([]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        unmount();
        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("lists the place's requests and answers one", async () => {
        const fetchMock = mockApi({
            "GET /api/places/place-1": place,
            "GET /api/places/place-1/invitations": [
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

        expect(await screen.findByRole("heading", { level: 1, name: "Event requests" })).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Reject Summer Opening" }));

        expect(await screen.findByText("Invitation rejected.")).toBeInTheDocument();
        expect(fetchMock.requests.some((r) => r.method === "PUT")).toBe(true);
    });

    it("explains when there are none and retries after a failure", async () => {
        let calls = 0;
        mockApi({
            "GET /api/places/place-1": place,
            "GET /api/places/place-1/invitations": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText("No event organizer has asked for this place yet.")).toBeInTheDocument();
    });
});
