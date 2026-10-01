import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { eventPlan } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from "@/test/helpers";

import { NewEventPlanPage } from "./NewEventPlanPage";

function renderPage(auth = authenticatedSnapshot([Role.EVENT_ORGANIZER])) {
    return renderWithProviders(<NewEventPlanPage />, {
        route: "/admin/events/plans/new",
        path: "/admin/events/plans/new",
        auth,
        dataRouter: true,
    });
}

describe("NewEventPlanPage", () => {
    it("shows the 404 page to users without the organizer role", async () => {
        renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("checks the times and the price on their step", async () => {
        mockApi({});
        renderPage();
        await userEvent.type(await screen.findByLabelText("Title"), "Summer Opening");
        await userEvent.click(screen.getByRole("button", { name: "Next" }));

        await userEvent.type(await screen.findByLabelText("Entry price"), "12.5");
        await userEvent.click(screen.getByRole("button", { name: "Next" }));

        expect(await screen.findByText("Start is required.")).toBeInTheDocument();
        expect(screen.getByText("Enter the price in forints, digits only (0 for free).")).toBeInTheDocument();
    });

    it("creates the plan and opens its workspace", async () => {
        const fetchMock = mockApi({ "POST /api/event-plan": { ...eventPlan, id: "plan-9" } });
        renderPage();

        await userEvent.type(await screen.findByLabelText("Title"), "Summer Opening");
        await userEvent.selectOptions(screen.getByLabelText("Kind"), "TECHNO");
        await userEvent.click(screen.getByRole("button", { name: "Next" }));
        // DateTimeRangeFields labels its inputs Start and End.
        await userEvent.type(await screen.findByLabelText("Start"), "2030-07-01T18:00");
        await userEvent.type(screen.getByLabelText("End"), "2030-07-02T02:00");
        await userEvent.type(screen.getByLabelText("Entry price"), "0");
        await userEvent.click(screen.getByRole("button", { name: "Next" }));
        await userEvent.click(await screen.findByRole("button", { name: "Continue to review" }));

        expect(await screen.findByText("Free")).toBeInTheDocument();
        expect(screen.getByText("Techno")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Create event plan" }));

        expect(await screen.findByText("other page")).toBeInTheDocument();
        expect(requestBody(fetchMock, 0)).toEqual({
            title: "Summer Opening",
            kind: "TECHNO",
            description: "",
            startDateTime: "2030-07-01T18:00",
            endDateTime: "2030-07-02T02:00",
            price: "0",
            image: null,
        });
    });

    it("sends anonymous visitors to login", async () => {
        const { client } = renderWithProviders(<NewEventPlanPage />, {
            route: "/admin/events/plans/new",
            path: "/admin/events/plans/new",
            dataRouter: true,
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/events/plans/new"));
    });
});
