import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PerformerOverviewPage } from "./PerformerOverviewPage";

const invitation = (eventPlanId: string, title: string, state: "PENDING" | "ACCEPTED" | "REJECTED") => ({
    eventPlanId,
    eventPlanTitle: title,
    state,
    startTime: "2030-07-01T20:00:00",
    endTime: "2030-07-01T22:00:00",
    performer,
});

function renderPage(auth = authenticatedSnapshot([Role.PERFORMER_MANAGER])) {
    return renderWithProviders(<PerformerOverviewPage />, {
        route: "/admin/performers/performer-1",
        path: "/admin/performers/:id",
        auth,
    });
}

describe("PerformerOverviewPage", () => {
    it("shows the 404 page to other roles and for an unknown performer", async () => {
        mockApi({ "GET /api/performers/performer-1/invitations": [] });
        const { unmount } = renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        unmount();
        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("counts the invitations, answers a waiting one and shows the public profile", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": [
                invitation("plan-1", "Summer Opening", "PENDING"),
                invitation("plan-2", "Jazz Night", "ACCEPTED"),
            ],
            "PUT /api/performers/performer-1/invitations/plan-1/respond?state=accept": null,
        });
        renderPage();

        expect(await screen.findByRole("heading", { level: 1, name: performer.name })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Waiting for your answer\s*1/ })).toHaveAttribute(
            "href",
            "/admin/performers/performer-1/requests",
        );
        expect(screen.getByRole("link", { name: /View public page/ })).toHaveAttribute(
            "href",
            "/performers/performer-1",
        );
        expect(within(screen.getByRole("region", { name: "Public profile" })).getByText("techno")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Accept Summer Opening" }));

        expect(await screen.findByText("Invitation accepted.")).toBeInTheDocument();
        expect(fetchMock.requests.some((r) => r.method === "PUT")).toBe(true);
    });

    it("explains an empty profile and retries after a failure", async () => {
        let calls = 0;
        mockApi({
            "GET /api/performers/performer-1": { ...performer, bio: "", genre: "", links: [] },
            "GET /api/performers/performer-1/invitations": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText(/No bio yet/)).toBeInTheDocument();
    });
});
