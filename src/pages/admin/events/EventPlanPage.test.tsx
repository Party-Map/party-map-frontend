import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { EventPlan } from "@/api/types";
import { Role } from "@/auth/roles";
import { eventPlan, performer, place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { EventPlanPage } from "./EventPlanPage";

const invitable = [{ id: place.id, name: place.name, address: place.address, city: place.city }];

function api(plan: EventPlan = eventPlan, lineup: unknown[] = []) {
    return {
        "GET /api/event-plan/plan-1": plan,
        "GET /api/event-plan/plan-1/lineup-invitations": lineup,
        "GET /api/performers": [performer],
        "GET /api/event-plan/places": invitable,
    };
}

function renderPage(auth = authenticatedSnapshot([Role.EVENT_ORGANIZER])) {
    return renderWithProviders(<EventPlanPage />, {
        route: "/admin/events/plans/plan-1",
        path: "/admin/events/plans/:id",
        auth,
    });
}

describe("EventPlanPage", () => {
    it("shows the 404 page to other roles and for an unknown plan", async () => {
        mockApi({});
        const { unmount } = renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        unmount();

        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows an error with retry when loading fails", async () => {
        let calls = 0;
        mockApi({
            ...api(),
            "GET /api/performers": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [performer];
            },
        });
        renderPage();

        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: "Summer Opening" })).toBeInTheDocument();
    });

    it("lays out the details, venue, lineup and checklist, with publishing off until ready", async () => {
        mockApi(api());
        renderPage();

        expect(await screen.findByRole("heading", { level: 1, name: "Summer Opening" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Edit details" })).toHaveAttribute(
            "href",
            "/admin/events/plans/plan-1/edit",
        );
        expect(screen.getByRole("heading", { name: "Venue" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Lineup" })).toBeInTheDocument();
        const checklist = screen.getByRole("region", { name: "Ready to publish?" });
        expect(within(checklist).getByText("Invite a place to host the event.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
        const details = screen.getByRole("region", { name: "Details" });
        expect(within(details).getByText("Disco")).toBeInTheDocument();
        expect(within(details).getByText("2500 HUF")).toBeInTheDocument();
        expect(within(details).getByText("Season opener.")).toBeInTheDocument();
    });

    it("enables publishing once the venue accepted and no performer is pending", async () => {
        mockApi(
            api({ ...eventPlan, price: "0", description: "", placeInvitation: { state: "ACCEPTED", place } }, [
                { performer, state: "ACCEPTED", startTime: "2030-07-01T20:00:00", endTime: "2030-07-01T22:00:00" },
            ]),
        );
        renderPage();

        expect(await screen.findByText("Ready")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
        expect(screen.getByText("Free entry")).toBeInTheDocument();
        expect(screen.getByText(/with 1 confirmed performer/)).toBeInTheDocument();
    });

    it("says when no price is set", async () => {
        mockApi(api({ ...eventPlan, price: null }));
        renderPage();
        expect(await screen.findByText("No price set")).toBeInTheDocument();
    });
});
