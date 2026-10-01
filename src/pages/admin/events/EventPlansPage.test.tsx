import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { EventPlansPage } from "./EventPlansPage";

const plan = (id: string, title: string, start: string) => ({
    id,
    title,
    startDateTime: start,
    endDateTime: start.replace("T18", "T23"),
});

function renderPage(roles: Role[] = [Role.EVENT_ORGANIZER]) {
    return renderWithProviders(<EventPlansPage />, { auth: authenticatedSnapshot(roles) });
}

describe("EventPlansPage", () => {
    it("is not found for users who do not organize events", async () => {
        mockApi({});
        renderPage([]);
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("lists the plans by start, each opening its workspace", async () => {
        mockApi({
            "GET /api/event-plan/owned-event-plans": [
                plan("p2", "Later", "2030-08-01T18:00:00"),
                plan("p1", "Sooner", "2030-07-01T18:00:00"),
            ],
        });
        renderPage();

        const links = await screen.findAllByRole("link", { name: /Sooner|Later/ });
        expect(links.map((link) => link.getAttribute("href"))).toEqual([
            "/admin/events/plans/p1",
            "/admin/events/plans/p2",
        ]);
    });

    it("explains an empty list and offers a retry after a failure", async () => {
        let calls = 0;
        mockApi({
            "GET /api/event-plan/owned-event-plans": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText(/You have no event plans yet/)).toBeInTheDocument();
    });
});
