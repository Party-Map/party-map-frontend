import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PerformerInvitationRequest } from "@/api/types";
import { formatDateTimeRange } from "@/lib/format";
import { performer } from "@/test/fixtures";
import { mockApi, renderWithProviders } from "@/test/helpers";

import { PerformerInvitationRequests } from "./PerformerInvitationRequests";

const pending: PerformerInvitationRequest = {
    eventPlanId: "plan-1",
    performer,
    eventPlanTitle: "Summer Opening",
    state: "PENDING",
    startTime: "2030-07-01T22:00:00",
    endTime: "2030-07-02T00:00:00",
};
const accepted: PerformerInvitationRequest = {
    ...pending,
    eventPlanId: "plan-2",
    state: "ACCEPTED",
    eventPlanTitle: "Accepted Night",
};
const rejected: PerformerInvitationRequest = {
    ...pending,
    eventPlanId: "plan-3",
    state: "REJECTED",
    eventPlanTitle: "Rejected Night",
};

const buttonsOf = (title: string) => {
    const card = screen.getByRole("heading", { name: title }).closest('div[class*="request-card"]');
    if (!card) throw new Error(`no card for ${title}`);
    return {
        accept: screen.getAllByRole("button", { name: "Accept" }).find((b) => card.contains(b)),
        reject: screen.getAllByRole("button", { name: "Reject" }).find((b) => card.contains(b)),
    };
};

describe("PerformerInvitationRequests", () => {
    it("shows an empty message without requests", () => {
        renderWithProviders(<PerformerInvitationRequests performerId="performer-1" requests={[]} />);
        expect(screen.getByRole("heading", { name: "Event requests" })).toBeInTheDocument();
        expect(screen.getByText("No event requests at the moment for this performer.")).toBeInTheDocument();
    });

    it("renders one card per request with its state, slot and the matching action disabled", () => {
        renderWithProviders(
            <PerformerInvitationRequests performerId="performer-1" requests={[pending, accepted, rejected]} />,
        );

        expect(screen.getByText("Summer Opening")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText("Accepted")).toBeInTheDocument();
        expect(screen.getByText("Rejected")).toBeInTheDocument();
        expect(screen.getAllByText(formatDateTimeRange(pending.startTime, pending.endTime))).toHaveLength(3);
        expect(screen.getAllByText(/invited this performer to play at an event/)).toHaveLength(3);

        expect(buttonsOf("Summer Opening").accept).toBeEnabled();
        expect(buttonsOf("Summer Opening").reject).toBeEnabled();
        expect(buttonsOf("Accepted Night").accept).toBeDisabled();
        expect(buttonsOf("Accepted Night").reject).toBeEnabled();
        expect(buttonsOf("Rejected Night").accept).toBeEnabled();
        expect(buttonsOf("Rejected Night").reject).toBeDisabled();
    });

    it("accepts an invitation and refreshes the lists that show it", async () => {
        const fetchMock = mockApi({ "PUT /api/performers/performer-1/invitations/plan-1/respond?state=accept": null });
        const { queryClient } = renderWithProviders(
            <PerformerInvitationRequests performerId="performer-1" requests={[pending]} />,
        );
        const invalidate = vi.spyOn(queryClient, "invalidateQueries");

        await userEvent.click(screen.getByRole("button", { name: "Accept" }));

        await waitFor(() => expect(invalidate).toHaveBeenCalled());
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.requests[0]?.url).toBe(
            "http://api.test/api/performers/performer-1/invitations/plan-1/respond?state=accept",
        );
        expect(fetchMock.requests[0]?.method).toBe("PUT");
        expect(screen.getByText("Invitation accepted.")).toBeInTheDocument();
    });

    it("rejects an invitation", async () => {
        const fetchMock = mockApi({ "PUT /api/performers/performer-1/invitations/plan-1/respond?state=reject": null });
        const { queryClient } = renderWithProviders(
            <PerformerInvitationRequests performerId="performer-1" requests={[pending]} />,
        );
        const invalidate = vi.spyOn(queryClient, "invalidateQueries");

        await userEvent.click(screen.getByRole("button", { name: "Reject" }));

        await waitFor(() => expect(invalidate).toHaveBeenCalled());
        expect(fetchMock.requests[0]?.url).toContain("/respond?state=reject");
        expect(screen.getByText("Invitation rejected.")).toBeInTheDocument();
    });

    it("disables both actions while the answer is being sent", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(() => new Promise<Response>(() => {})),
        );
        renderWithProviders(<PerformerInvitationRequests performerId="performer-1" requests={[pending]} />);

        await userEvent.click(screen.getByRole("button", { name: "Reject" }));

        expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
    });

    it("reports a failed answer and keeps the list as it is", async () => {
        mockApi({
            "PUT /api/performers/performer-1/invitations/plan-1/respond?state=accept": () =>
                new Response("nope", { status: 500 }),
        });
        const { queryClient } = renderWithProviders(
            <PerformerInvitationRequests performerId="performer-1" requests={[pending]} />,
        );
        const invalidate = vi.spyOn(queryClient, "invalidateQueries");

        await userEvent.click(screen.getByRole("button", { name: "Accept" }));

        expect(await screen.findByText("Could not answer the invitation. Please try again.")).toBeInTheDocument();
        expect(invalidate).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
    });
});
