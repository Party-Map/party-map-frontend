import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Role } from "@/lib/auth/roles";
import { formatDateTimeRange } from "@/lib/dates";
import type { EventPlanListItem, OwnedEventListItem } from "@/lib/types";
import { eventPlan } from "@/test/fixtures";
import { ANONYMOUS, authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";
import { AdminEventsPage } from "./AdminEventsPage";

const plans: EventPlanListItem[] = [
    {
        id: eventPlan.id,
        title: eventPlan.title,
        startDateTime: eventPlan.startDateTime,
        endDateTime: eventPlan.endDateTime,
    },
];
const upcomingEvent: OwnedEventListItem = {
    id: "event-1",
    title: "Techno Night",
    start: "2030-06-01T20:00:00",
    end: "2030-06-02T04:00:00",
    placeName: "A38 Hajó",
};
const pastEvent: OwnedEventListItem = {
    id: "event-0",
    title: "Old Party",
    start: "2020-01-01T20:00:00",
    end: "2020-01-02T02:00:00",
    placeName: "Dürer Kert",
};

const PLANS = "GET /api/event-plan/owned-event-plans";
const EVENTS = "GET /api/events/owned-events";
const failure = () => new Response("boom", { status: 500 });

function renderPage(auth = authenticatedSnapshot([Role.EVENT_ORGANIZER])) {
    return renderWithProviders(<AdminEventsPage />, { route: "/admin/events", path: "/admin/events", auth });
}

function pastDetails(count: number): HTMLElement {
    const details = screen.getByText(`Past events (${count})`).closest("details");
    if (!details) throw new Error("past events <details> not rendered");
    return details;
}

describe("AdminEventsPage", () => {
    it("sends anonymous visitors to sign in", async () => {
        mockApi({});
        const { client } = renderPage(ANONYMOUS);
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/events"));
    });

    it("shows a 404 to users without the organizer role", async () => {
        const fetchMock = mockApi({});
        renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("lists event plans and splits events into upcoming and past", async () => {
        mockApi({ [PLANS]: plans, [EVENTS]: [upcomingEvent, pastEvent] });
        renderPage();

        expect(await screen.findByText("Loading event plans…")).toBeInTheDocument();
        expect(screen.getByText("Loading your events…")).toBeInTheDocument();

        expect(await screen.findByText("Summer Opening")).toBeInTheDocument();
        expect(
            screen.getByText(formatDateTimeRange(eventPlan.startDateTime, eventPlan.endDateTime)),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Add a new Event Plan" })).toHaveAttribute("href", "/admin/events/new");

        expect(await screen.findByText("Techno Night")).toBeInTheDocument();
        expect(screen.getByText(formatDateTimeRange(upcomingEvent.start, upcomingEvent.end))).toBeInTheDocument();
        expect(screen.getByText("A38 Hajó")).toBeInTheDocument();
        expect(screen.queryByText("You have no live events.")).not.toBeInTheDocument();

        const details = pastDetails(1);
        expect(details).not.toHaveAttribute("open");
        expect(within(details).getByText("Old Party")).toBeInTheDocument();
        expect(within(details).getByText("Dürer Kert")).toBeInTheDocument();

        const hrefs = screen.getAllByRole("link", { name: "View" }).map((link) => link.getAttribute("href"));
        expect(hrefs).toEqual(["/admin/events/plan-1", "/events/event-1", "/events/event-0"]);
    });

    it("toggles the past events", async () => {
        mockApi({ [PLANS]: [], [EVENTS]: [pastEvent] });
        renderPage();
        const user = userEvent.setup();

        const summary = await screen.findByText("Past events (1)");
        expect(pastDetails(1)).not.toHaveAttribute("open");
        await user.click(summary);
        expect(pastDetails(1)).toHaveAttribute("open");
        await user.click(summary);
        expect(pastDetails(1)).not.toHaveAttribute("open");
    });

    it("shows empty states", async () => {
        mockApi({ [PLANS]: [], [EVENTS]: [] });
        renderPage();

        expect(await screen.findByText("You have no event plans yet.")).toBeInTheDocument();
        expect(await screen.findByText("You have no live events.")).toBeInTheDocument();
        expect(within(pastDetails(0)).getByText("You have no past events.")).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "View" })).not.toBeInTheDocument();
    });

    it("shows an error for the plans and reloads them on retry", async () => {
        let calls = 0;
        mockApi({ [PLANS]: () => (calls++ === 0 ? failure() : plans), [EVENTS]: [] });
        renderPage();
        const user = userEvent.setup();

        expect(await screen.findByText("Could not load your event plans.")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findByText("Summer Opening")).toBeInTheDocument();
        expect(screen.queryByText("Could not load your event plans.")).not.toBeInTheDocument();
    });

    it("shows an error for the events", async () => {
        mockApi({ [PLANS]: plans, [EVENTS]: failure });
        renderPage();

        expect(await screen.findByText("Could not load your events.")).toBeInTheDocument();
        expect(screen.queryByText("Past events (0)")).not.toBeInTheDocument();
    });
});
