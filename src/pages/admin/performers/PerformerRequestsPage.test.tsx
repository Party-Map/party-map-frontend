import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PerformerRequestsPage } from "./PerformerRequestsPage";

const owned = [{ id: performer.id, name: performer.name }];

function renderPage(roles: Role[] = [Role.PERFORMER_MANAGER]) {
    return renderWithProviders(<PerformerRequestsPage />, { auth: authenticatedSnapshot(roles) });
}

describe("PerformerRequestsPage", () => {
    it("is not found for users who do not manage performers", async () => {
        mockApi({});
        renderPage([Role.EVENT_ORGANIZER]);
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("lists the lineup invitations and rejects one", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/owned-performers": owned,
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

        await userEvent.click(await screen.findByRole("button", { name: "Reject Summer Opening for DJ Test" }));

        expect(await screen.findByText("Invitation rejected.")).toBeInTheDocument();
        expect(fetchMock.requests.find((r) => r.method === "PUT")?.url).toContain("state=reject");
    });

    it("explains when there are no requests", async () => {
        mockApi({ "GET /api/performers/owned-performers": [] });
        renderPage();
        expect(
            await screen.findByText(/No event organizer has invited one of your performers yet/),
        ).toBeInTheDocument();
    });

    it("offers a retry when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/performers/owned-performers": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText(/No event organizer has invited/)).toBeInTheDocument();
    });
});
