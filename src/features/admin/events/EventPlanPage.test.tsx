import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as ReactRouter from "react-router";
import { vi } from "vitest";
import { Role } from "@/lib/auth/roles";
import type { EventPlan, PlaceListItem } from "@/lib/types";
import { eventPlan, performer, place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";
import { EventPlanPage } from "./EventPlanPage";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("react-router", async (importOriginal) => ({
    ...(await importOriginal<typeof ReactRouter>()),
    useNavigate: () => navigate,
}));

const PLAN = "GET /api/event-plan/plan-1";
const placeItem: PlaceListItem = { id: place.id, name: place.name, address: place.address, city: place.city };
const routes = {
    [PLAN]: eventPlan,
    "GET /api/performers": [performer],
    "GET /api/event-plan/plan-1/lineup-invitations": [],
    "GET /api/event-plan/places": [placeItem],
};
const failure = () => new Response("boom", { status: 500 });

function renderPage(auth = authenticatedSnapshot([Role.EVENT_ORGANIZER])) {
    return renderWithProviders(<EventPlanPage />, { route: "/admin/events/plan-1", path: "/admin/events/:id", auth });
}

describe("EventPlanPage", () => {
    beforeEach(() => navigate.mockClear());

    it("shows a 404 to users without the organizer role", async () => {
        const fetchMock = mockApi(routes);
        renderPage(authenticatedSnapshot([Role.PERFORMER_MANAGER]));

        expect(await screen.findByText("404")).toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows a 404 when the plan does not exist", async () => {
        mockApi({ ...routes, [PLAN]: () => new Response("missing", { status: 404 }) });
        renderPage();

        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows an error with retry when loading fails", async () => {
        let calls = 0;
        mockApi({ ...routes, [PLAN]: () => (calls++ === 0 ? failure() : eventPlan) });
        renderPage();
        const user = userEvent.setup();

        expect(await screen.findByText("Could not load the event plan.")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByLabelText("Title")).toHaveValue("Summer Opening");
    });

    it("shows an error when the performers cannot be loaded", async () => {
        mockApi({ ...routes, "GET /api/performers": failure });
        renderPage();

        expect(await screen.findByText("Could not load the event plan.")).toBeInTheDocument();
        expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    });

    it("prefills the form, shows the tools and saves changes", async () => {
        let body: unknown;
        mockApi({
            ...routes,
            "PUT /api/event-plan/plan-1": (init: RequestInit | undefined) => {
                body = JSON.parse(String(init?.body));
                return eventPlan;
            },
        });
        renderPage();
        const user = userEvent.setup();

        expect(await screen.findByText("Loading event plan…")).toBeInTheDocument();
        const title = await screen.findByLabelText("Title");
        expect(title).toHaveValue("Summer Opening");
        expect(screen.getByRole("heading", { name: "Edit event plan" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Publish event" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Place invitation" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Create a line up" })).toBeInTheDocument();
        expect(await screen.findByRole("combobox", { name: "Performer" })).toBeInTheDocument();

        await user.clear(title);
        await user.type(title, "Summer Closing");
        await user.click(screen.getByRole("button", { name: "Save changes" }));

        await waitFor(() => expect(navigate).toHaveBeenCalledWith("/admin/events"));
        expect(body).toEqual({
            title: "Summer Closing",
            kind: "DISCO",
            startDateTime: "2030-07-01T18:00",
            endDateTime: "2030-07-02T02:00",
            description: "Season opener.",
            price: "2500",
            image: "https://images.example/plan.jpg",
        });
        expect(screen.getByText("Event plan saved.")).toBeInTheDocument();
    });

    it("offers to invite a place and reloads the plan after sending", async () => {
        let planCalls = 0;
        const invited: EventPlan = { ...eventPlan, placeInvitation: { state: "PENDING", place } };
        mockApi({
            ...routes,
            [PLAN]: () => (planCalls++ === 0 ? eventPlan : invited),
            "PUT /api/event-plan/plan-1/invite-place/place-1": null,
        });
        renderPage();
        const user = userEvent.setup();

        const select = await screen.findByRole("combobox", { name: "Place" });
        await waitFor(() => expect(select).toBeEnabled());
        await user.selectOptions(select, "place-1");
        await user.click(screen.getByRole("button", { name: "Send Invitation" }));

        expect(await screen.findByText(/invited to a place \(A38 Hajó\) with a status of/)).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.queryByRole("combobox", { name: "Place" })).not.toBeInTheDocument();
    });

    it("shows the state of an accepted invitation instead of the invite form", async () => {
        mockApi({ ...routes, [PLAN]: { ...eventPlan, placeInvitation: { state: "ACCEPTED", place } } });
        renderPage();

        expect(await screen.findByText(/invited to a place \(A38 Hajó\) with a status of/)).toBeInTheDocument();
        expect(screen.getByText("Accepted")).toBeInTheDocument();
        expect(screen.queryByRole("combobox", { name: "Place" })).not.toBeInTheDocument();
    });

    it("offers to invite again after a rejection", async () => {
        mockApi({ ...routes, [PLAN]: { ...eventPlan, placeInvitation: { state: "REJECTED", place } } });
        renderPage();

        expect(await screen.findByRole("combobox", { name: "Place" })).toBeInTheDocument();
        expect(screen.queryByText(/invited to a place/)).not.toBeInTheDocument();
    });
});
