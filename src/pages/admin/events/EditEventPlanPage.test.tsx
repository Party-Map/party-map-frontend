import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { eventPlan } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from "@/test/helpers";

import { EditEventPlanPage } from "./EditEventPlanPage";

function renderPage(auth = authenticatedSnapshot([Role.EVENT_ORGANIZER])) {
    return renderWithProviders(<EditEventPlanPage />, {
        route: "/admin/events/plans/plan-1/edit",
        path: "/admin/events/plans/:id/edit",
        auth,
        dataRouter: true,
    });
}

describe("EditEventPlanPage", () => {
    it("shows the 404 page to other roles and for an unknown plan", async () => {
        mockApi({});
        const { unmount } = renderPage(authenticatedSnapshot([Role.PERFORMER_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        unmount();

        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows an error with a retry action when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/event-plan/plan-1": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : eventPlan;
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: `Edit ${eventPlan.title}` })).toBeInTheDocument();
    });

    it("saves the changed details and returns to the workspace", async () => {
        const fetchMock = mockApi({ "GET /api/event-plan/plan-1": eventPlan, "PUT /api/event-plan/plan-1": eventPlan });
        renderPage();

        const crumbs = await screen.findByRole("navigation", { name: "Breadcrumb" });
        expect(within(crumbs).getByRole("link", { name: eventPlan.title })).toHaveAttribute(
            "href",
            "/admin/events/plans/plan-1",
        );
        const steps = screen.getByRole("navigation", { name: "Form steps" });
        await userEvent.click(within(steps).getByRole("button", { name: /Time & price/ }));
        await userEvent.clear(screen.getByLabelText("Entry price"));
        await userEvent.type(screen.getByLabelText("Entry price"), "3000");
        await userEvent.click(within(steps).getByRole("button", { name: /Review/ }));
        await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

        expect(await screen.findByText("other page")).toBeInTheDocument();
        expect(screen.getByText("Event plan saved.")).toBeInTheDocument();
        expect(requestBody(fetchMock, 1)).toMatchObject({ title: eventPlan.title, price: "3000" });
    });
});
