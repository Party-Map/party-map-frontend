import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { eventPlan } from "@/test/fixtures";
import { mockApi, renderWithProviders } from "@/test/helpers";

import { PublishButton } from "./PublishButton";

describe("PublishButton", () => {
    it("stays disabled until the plan is ready", () => {
        renderWithProviders(<PublishButton plan={eventPlan} disabled />);
        expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    });

    it("does nothing when the confirmation is cancelled", async () => {
        const fetchMock = mockApi({});
        renderWithProviders(<PublishButton plan={eventPlan} />);

        await userEvent.click(screen.getByRole("button", { name: "Publish" }));
        expect(await screen.findByRole("alertdialog", { name: "Publish Summer Opening?" })).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

        await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("publishes and opens the live events", async () => {
        mockApi({ "POST /api/event-plan/plan-1/publish": null });
        renderWithProviders(<PublishButton plan={eventPlan} />, {
            route: "/admin/events/plans/plan-1",
            path: "/admin/events/plans/:id",
        });

        await userEvent.click(screen.getByRole("button", { name: "Publish" }));
        const dialog = await screen.findByRole("alertdialog");
        await userEvent.click(within(dialog).getByRole("button", { name: "Publish" }));

        expect(await screen.findByText("Summer Opening is published and on the map.")).toBeInTheDocument();
        expect(await screen.findByText("other page")).toBeInTheDocument();
    });

    it("shows the API's reason when publishing is refused", async () => {
        mockApi({
            "POST /api/event-plan/plan-1/publish": Response.json(
                { status: 409, detail: "The plan has no accepted place yet." },
                { status: 409 },
            ),
        });
        renderWithProviders(<PublishButton plan={eventPlan} />);

        await userEvent.click(screen.getByRole("button", { name: "Publish" }));
        await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publish" }));

        expect(await screen.findByText("The plan has no accepted place yet.")).toBeInTheDocument();
    });

    it("is disabled while publishing", async () => {
        mockApi({ "POST /api/event-plan/plan-1/publish": () => new Promise(() => {}) });
        renderWithProviders(<PublishButton plan={eventPlan} />);

        await userEvent.click(screen.getByRole("button", { name: "Publish" }));
        await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publish" }));

        expect(await screen.findByRole("button", { name: "Publishing…" })).toBeDisabled();
    });
});
