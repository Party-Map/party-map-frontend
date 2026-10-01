import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PerformersOverviewPage } from "./PerformersOverviewPage";

const invitation = (eventPlanId: string, title: string, state: "PENDING" | "ACCEPTED" | "REJECTED") => ({
    eventPlanId,
    eventPlanTitle: title,
    state,
    startTime: "2030-07-01T20:00:00",
    endTime: "2030-07-01T22:00:00",
    performer,
});

function renderPage(roles: Role[] = [Role.PERFORMER_MANAGER]) {
    return renderWithProviders(<PerformersOverviewPage />, { auth: authenticatedSnapshot(roles) });
}

describe("PerformersOverviewPage", () => {
    it("is not found for users who do not manage performers", async () => {
        mockApi({});
        renderPage([Role.PLACE_MANAGER]);
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("counts the performers and requests and answers a pending one", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/owned-performers": [{ id: performer.id, name: performer.name }],
            "GET /api/performers/performer-1/invitations": [
                invitation("plan-1", "Summer Opening", "PENDING"),
                invitation("plan-2", "Jazz Night", "ACCEPTED"),
            ],
            "PUT /api/performers/performer-1/invitations/plan-1/respond?state=accept": null,
        });
        renderPage();

        expect(await screen.findByRole("link", { name: /Performers\s*1/ })).toHaveAttribute(
            "href",
            "/admin/performers/list",
        );
        expect(screen.getByRole("link", { name: /Waiting for your answer\s*1/ })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "New performer" })).toHaveAttribute("href", "/admin/performers/new");

        await userEvent.click(screen.getByRole("button", { name: "Accept Summer Opening for DJ Test" }));

        expect(await screen.findByText("Invitation accepted.")).toBeInTheDocument();
        expect(fetchMock.requests.some((r) => r.method === "PUT")).toBe(true);
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
        expect(await screen.findByText("Nothing is waiting for your answer.")).toBeInTheDocument();
    });
});
