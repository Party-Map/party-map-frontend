import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as ReactRouter from "react-router";
import { vi } from "vitest";
import type { EventPlan } from "@/lib/types";
import { eventPlan, place } from "@/test/fixtures";
import { mockApi, renderWithProviders } from "@/test/helpers";
import { PublishButton } from "./PublishButton";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("react-router", async (importOriginal) => ({
    ...(await importOriginal<typeof ReactRouter>()),
    useNavigate: () => navigate,
}));

const PUBLISH = "POST /api/event-plan/plan-1/publish";
const invitedPlan: EventPlan = { ...eventPlan, placeInvitation: { state: "ACCEPTED", place } };

async function openConfirmation(plan: EventPlan) {
    renderWithProviders(<PublishButton plan={plan} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Publish event" }));
    const dialog = screen.getByRole("alertdialog", { name: "Publish event?" });
    expect(within(dialog).getByText("Once published, this cannot be undone. Continue?")).toBeInTheDocument();
    return { user, dialog };
}

describe("PublishButton", () => {
    beforeEach(() => navigate.mockClear());

    it("does nothing when the confirmation is cancelled", async () => {
        const fetchMock = mockApi({ [PUBLISH]: null });
        const { user, dialog } = await openConfirmation(invitedPlan);

        await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it("publishes and opens the map focused on the invited place", async () => {
        const fetchMock = mockApi({ [PUBLISH]: null });
        const { user, dialog } = await openConfirmation(invitedPlan);

        await user.click(within(dialog).getByRole("button", { name: "Yes, publish" }));

        await waitFor(() => expect(navigate).toHaveBeenCalledWith("/?focus=place-1"));
        expect(fetchMock).toHaveBeenCalledWith(
            "http://api.test/api/event-plan/plan-1/publish",
            expect.objectContaining({ method: "POST" }),
        );
        expect(screen.getByText("Event plan published successfully!")).toBeInTheDocument();
    });

    it("falls back to the map root without a place invitation", async () => {
        mockApi({ [PUBLISH]: null });
        const { user, dialog } = await openConfirmation(eventPlan);

        await user.click(within(dialog).getByRole("button", { name: "Yes, publish" }));

        await waitFor(() => expect(navigate).toHaveBeenCalledWith("/"));
    });

    it("shows an error when publishing fails", async () => {
        mockApi({ [PUBLISH]: () => new Response("conflict", { status: 409 }) });
        const { user, dialog } = await openConfirmation(invitedPlan);

        await user.click(within(dialog).getByRole("button", { name: "Yes, publish" }));

        expect(
            await screen.findByText(
                "Failed to publish event plan. Check if the place accepted the invitation and there are no pending performer invitations!",
            ),
        ).toBeInTheDocument();
        expect(navigate).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "Publish event" })).toBeEnabled();
    });

    it("is disabled while publishing", async () => {
        const fetchMock = mockApi({});
        let release = () => {};
        fetchMock.mockImplementation(
            () => new Promise<Response>((resolve) => (release = () => resolve(new Response(null, { status: 204 })))),
        );
        const { user, dialog } = await openConfirmation(invitedPlan);

        await user.click(within(dialog).getByRole("button", { name: "Yes, publish" }));

        expect(await screen.findByRole("button", { name: "Publishing…" })).toBeDisabled();
        release();
        await waitFor(() => expect(navigate).toHaveBeenCalledWith("/?focus=place-1"));
        expect(screen.getByRole("button", { name: "Publish event" })).toBeEnabled();
    });
});
