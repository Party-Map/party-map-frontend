import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { eventPlan } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { EventsOverviewPage } from "./EventsOverviewPage";

const planItem = {
    id: eventPlan.id,
    title: eventPlan.title,
    startDateTime: eventPlan.startDateTime,
    endDateTime: eventPlan.endDateTime,
};
const future = {
    id: "e1",
    title: "Future Rave",
    start: "2099-01-01T20:00:00",
    end: "2099-01-02T04:00:00",
    placeName: "A38",
};
const past = {
    id: "e0",
    title: "Old Rave",
    start: "2001-01-01T20:00:00",
    end: "2001-01-02T04:00:00",
    placeName: "A38",
};

function renderPage(roles: Role[] = [Role.EVENT_ORGANIZER]) {
    return renderWithProviders(<EventsOverviewPage />, { auth: authenticatedSnapshot(roles) });
}

describe("EventsOverviewPage", () => {
    it("is not found for users who do not organize events", async () => {
        mockApi({});
        renderPage([Role.PLACE_MANAGER]);
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("counts plans and events and lists what is coming up", async () => {
        mockApi({
            "GET /api/event-plan/owned-event-plans": [planItem],
            "GET /api/events/owned-events": [future, past],
        });
        renderPage();

        expect(await screen.findByRole("link", { name: /Event plans\s*1/ })).toHaveAttribute(
            "href",
            "/admin/events/plans",
        );
        expect(screen.getByRole("link", { name: /Upcoming events\s*1/ })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Past events\s*1/ })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Future Rave/ })).toHaveAttribute("href", "/events/e1");
        expect(screen.getByRole("link", { name: /Future Rave/ })).toHaveAttribute("target", "_blank");
        expect(screen.queryByRole("link", { name: /Old Rave/ })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "New event plan" })).toHaveAttribute("href", "/admin/events/plans/new");
    });

    it("explains when nothing is coming up", async () => {
        mockApi({ "GET /api/event-plan/owned-event-plans": [], "GET /api/events/owned-events": [] });
        renderPage();
        expect(await screen.findByText(/No upcoming events/)).toBeInTheDocument();
    });

    it("offers a retry when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/event-plan/owned-event-plans": [],
            "GET /api/events/owned-events": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText(/No upcoming events/)).toBeInTheDocument();
    });
});
