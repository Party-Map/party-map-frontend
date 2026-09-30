import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as ReactRouter from "react-router";
import { vi } from "vitest";

import type { EventPlanPayload } from "@/api/types";
import { eventPlan } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";

import { EventPlanForm } from "./EventPlanForm";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("react-router", async (importOriginal) => ({
    ...(await importOriginal<typeof ReactRouter>()),
    useNavigate: () => navigate,
}));

function renderForm(onSubmit: (payload: EventPlanPayload) => Promise<void>, initialValues?: EventPlanPayload) {
    return renderWithProviders(
        <EventPlanForm
            title="Edit event plan"
            submitLabel="Save changes"
            initialValues={initialValues}
            onSubmit={onSubmit}
        />,
    );
}

describe("EventPlanForm", () => {
    beforeEach(() => navigate.mockClear());

    it("starts empty with the pub kind selected", () => {
        renderForm(vi.fn());

        expect(screen.getByRole("heading", { name: "Edit event plan" })).toBeInTheDocument();
        expect(screen.getByLabelText("Title")).toHaveValue("");
        expect(screen.getByLabelText("Event kind")).toHaveValue("PUB");
        expect(screen.getByRole("option", { name: "House Party" })).toBeInTheDocument();
        expect(screen.getByLabelText("Start")).toHaveValue("");
        expect(screen.getByLabelText("Price")).toHaveValue(null);
        expect(screen.getByText("HUF")).toBeInTheDocument();
    });

    it("prefills from the initial values", () => {
        renderForm(vi.fn(), { ...eventPlan, links: [{ type: "WEBSITE", url: "https://a38.hu/summer" }] });

        expect(screen.getByLabelText("Title")).toHaveValue("Summer Opening");
        expect(screen.getByLabelText("Event kind")).toHaveValue("DISCO");
        expect(screen.getByLabelText("Start")).toHaveValue("2030-07-01T18:00");
        expect(screen.getByLabelText("End")).toHaveValue("2030-07-02T02:00");
        expect(screen.getByLabelText("Description")).toHaveValue("Season opener.");
        expect(screen.getByLabelText("Price")).toHaveValue(2500);
        expect(screen.getByLabelText("Website link")).toHaveValue("a38.hu/summer");
        expect(screen.getByLabelText("Cover image URL")).toHaveValue("https://images.example/plan.jpg");
    });

    it("submits the edited values with the added link and a cleared image", async () => {
        const onSubmit = vi.fn(async () => {});
        renderForm(onSubmit, { ...eventPlan, links: [{ type: "WEBSITE", url: "https://a38.hu" }] });
        const user = userEvent.setup();

        await user.clear(screen.getByLabelText("Title"));
        await user.type(screen.getByLabelText("Title"), "Summer Closing");
        await user.click(screen.getByRole("button", { name: "+ Add link" }));
        await user.type(screen.getByLabelText("Instagram link"), "djtest");
        await user.clear(screen.getByLabelText("Cover image URL"));
        await user.click(screen.getByRole("button", { name: "Save changes" }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit).toHaveBeenCalledWith({
            title: "Summer Closing",
            kind: "DISCO",
            startDateTime: "2030-07-01T18:00",
            endDateTime: "2030-07-02T02:00",
            description: "Season opener.",
            price: "2500",
            links: [
                { type: "WEBSITE", url: "https://a38.hu" },
                { type: "INSTAGRAM", url: "https://instagram.com/djtest" },
            ],
            image: null,
        });
    });

    it("disables the buttons while saving", async () => {
        let finish = () => {};
        const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
        renderForm(onSubmit, eventPlan);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

        finish();
        expect(await screen.findByRole("button", { name: "Save changes" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    });

    it("shows an error when saving fails", async () => {
        renderForm(
            vi.fn(async () => Promise.reject(new Error("nope"))),
            eventPlan,
        );
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Could not save the event plan. Please try again.");
        expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    });

    it("goes back on cancel", async () => {
        renderForm(vi.fn());
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(navigate).toHaveBeenCalledWith(-1);
    });
});
