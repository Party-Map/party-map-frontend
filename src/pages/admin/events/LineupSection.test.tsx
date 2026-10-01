import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { EventPlanLineupInvitation, Performer } from "@/api/types";
import { eventPlan, performer } from "@/test/fixtures";
import { mockApi, renderWithProviders, requestBody } from "@/test/helpers";

import { LineupSection } from "./LineupSection";

const other: Performer = { ...performer, id: "performer-2", name: "MC Other", genre: "" };
const invited: EventPlanLineupInvitation = {
    performer,
    state: "PENDING",
    startTime: "2030-07-01T20:00:00",
    endTime: "2030-07-01T22:00:00",
};

describe("LineupSection", () => {
    it("explains an empty lineup and offers every performer", () => {
        renderWithProviders(<LineupSection plan={eventPlan} lineup={[]} performers={[performer, other]} />);

        expect(screen.getByText("No performers invited yet.")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "DJ Test (techno)" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "MC Other" })).toBeInTheDocument();
    });

    it("lists the invited performers with their answers and leaves them out of the picker", () => {
        renderWithProviders(<LineupSection plan={eventPlan} lineup={[invited]} performers={[performer]} />);

        expect(screen.getByRole("list", { name: "Invited performers" })).toHaveTextContent("DJ Test");
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Everyone is invited" })).toBeInTheDocument();
    });

    it("asks for a performer before inviting", async () => {
        const fetchMock = mockApi({});
        renderWithProviders(<LineupSection plan={eventPlan} lineup={[]} performers={[performer]} />);

        await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));

        expect(screen.getByText("Choose a performer and their time slot.")).toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("invites a performer for a slot inside the plan's time", async () => {
        const fetchMock = mockApi({ "POST /api/event-plan/plan-1/add-lineup-invitation": null });
        renderWithProviders(<LineupSection plan={eventPlan} lineup={[]} performers={[performer]} />);

        await userEvent.selectOptions(screen.getByRole("combobox", { name: "Performer" }), performer.id);
        await userEvent.clear(screen.getByLabelText("End"));
        await userEvent.type(screen.getByLabelText("End"), "2030-07-03T05:00");
        await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));

        expect(await screen.findByText("Invitation sent to the performer.")).toBeInTheDocument();
        expect(requestBody(fetchMock, 0)).toEqual({
            performerId: performer.id,
            startTime: "2030-07-01T18:00",
            endTime: "2030-07-02T02:00",
        });
    });

    it("shows the API's reason when the invitation is refused", async () => {
        mockApi({
            "POST /api/event-plan/plan-1/add-lineup-invitation": Response.json(
                { status: 409, detail: "This performer is already invited." },
                { status: 409 },
            ),
        });
        renderWithProviders(<LineupSection plan={eventPlan} lineup={[]} performers={[performer]} />);

        await userEvent.selectOptions(screen.getByRole("combobox", { name: "Performer" }), performer.id);
        await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));

        expect(await screen.findByText("This performer is already invited.")).toBeInTheDocument();
    });

    it("withdraws an invitation", async () => {
        const fetchMock = mockApi({ "DELETE /api/event-plan/plan-1/lineup-invitation/performer-1": null });
        renderWithProviders(<LineupSection plan={eventPlan} lineup={[invited]} performers={[performer]} />);

        await userEvent.click(screen.getByRole("button", { name: "Remove DJ Test from the lineup" }));

        expect(await screen.findByText("DJ Test removed from the lineup.")).toBeInTheDocument();
        expect(fetchMock.requests[0]?.method).toBe("DELETE");
    });

    it("reports a failed withdrawal", async () => {
        mockApi({
            "DELETE /api/event-plan/plan-1/lineup-invitation/performer-1": () => new Response("boom", { status: 500 }),
        });
        renderWithProviders(<LineupSection plan={eventPlan} lineup={[invited]} performers={[performer]} />);

        await userEvent.click(screen.getByRole("button", { name: "Remove DJ Test from the lineup" }));

        expect(await screen.findByText("Could not remove the performer. Please try again.")).toBeInTheDocument();
    });
});
