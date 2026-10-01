import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { LiveEventsPage } from "./LiveEventsPage";

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
    placeName: "Dürer",
};

function renderPage(roles: Role[] = [Role.EVENT_ORGANIZER]) {
    return renderWithProviders(<LiveEventsPage />, { auth: authenticatedSnapshot(roles) });
}

describe("LiveEventsPage", () => {
    it("is not found for users who do not organize events", async () => {
        mockApi({});
        renderPage([Role.PERFORMER_MANAGER]);
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("splits the published events into upcoming and past, each linking to its public page", async () => {
        mockApi({ "GET /api/events/owned-events": [past, future] });
        renderPage();

        expect(await screen.findByRole("heading", { name: "Upcoming (1)" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Past (1)" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Future Rave/ })).toHaveAttribute("href", "/events/e1");
        expect(screen.getByRole("link", { name: /Future Rave/ })).toHaveAttribute("target", "_blank");
        expect(screen.getByRole("link", { name: /Old Rave/ })).toHaveAttribute("href", "/events/e0");
        expect(screen.getByText("Dürer")).toBeInTheDocument();
    });

    it("explains empty lists and offers a retry after a failure", async () => {
        let calls = 0;
        mockApi({
            "GET /api/events/owned-events": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText("No upcoming events.")).toBeInTheDocument();
        expect(screen.getByText("No past events.")).toBeInTheDocument();
    });
});
