import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { SinglePerformerRequestsPage } from "./SinglePerformerRequestsPage";

function renderPage(auth = authenticatedSnapshot([Role.PERFORMER_MANAGER])) {
    return renderWithProviders(<SinglePerformerRequestsPage />, {
        route: "/admin/performers/performer-1/requests",
        path: "/admin/performers/:id/requests",
        auth,
    });
}

describe("SinglePerformerRequestsPage", () => {
    it("shows the 404 page to other roles and for an unknown place", async () => {
        mockApi({ "GET /api/performers/performer-1/invitations": [] });
        const { unmount } = renderPage(authenticatedSnapshot([]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        unmount();
        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("lists the place's requests and answers one", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": [
                {
                    eventPlanId: "plan-1",
                    eventPlanTitle: "Summer Opening",
                    state: "PENDING",
                    startTime: "2030-07-01T20:00:00",
                    endTime: "2030-07-01T22:00:00",
                    performer,
                },
            ],
            "PUT /api/performers/performer-1/invitations/plan-1/respond?state=reject": null,
        });
        renderPage();

        expect(await screen.findByRole("heading", { level: 1, name: "Lineup requests" })).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Reject Summer Opening" }));

        expect(await screen.findByText("Invitation rejected.")).toBeInTheDocument();
        expect(fetchMock.requests.some((r) => r.method === "PUT")).toBe(true);
    });

    it("explains when there are none and retries after a failure", async () => {
        let calls = 0;
        mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText("No event organizer has invited this performer yet.")).toBeInTheDocument();
    });
});
