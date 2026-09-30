import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EventPlanLineupInvitation, Performer } from "@/lib/types";
import { eventPlan, performer } from "@/test/fixtures";
import { mockApi, renderWithProviders } from "@/test/helpers";
import { LineupEditor } from "./LineupEditor";

const performer2: Performer = { ...performer, id: "performer-2", name: "MC Second" };
const performers = [performer, performer2];
const accepted: EventPlanLineupInvitation = {
    state: "ACCEPTED",
    startTime: "2030-07-01T20:00:00",
    endTime: "2030-07-01T22:00:00",
    performer,
};

const INVITATIONS = "GET /api/event-plan/plan-1/lineup-invitations";
const ADD = "POST /api/event-plan/plan-1/add-lineup-invitation";
const DELETE = "DELETE /api/event-plan/plan-1/lineup-invitation/performer-1";
const failure = () => new Response("boom", { status: 500 });

function at<T>(list: T[], index: number): T {
    const item = list[index];
    if (item === undefined) throw new Error(`No element at index ${index}`);
    return item;
}

const performerSelects = () => screen.getAllByRole("combobox", { name: "Performer" });
const removeButtons = () => screen.getAllByRole("button", { name: "Remove" });
const inviteButtons = () => screen.getAllByRole("button", { name: "Invite" });

async function renderEditor(routes: Parameters<typeof mockApi>[0]) {
    const fetchMock = mockApi({ [INVITATIONS]: [], ...routes });
    renderWithProviders(<LineupEditor plan={eventPlan} performers={performers} />);
    await screen.findByRole("combobox", { name: "Performer" });
    return { fetchMock, user: userEvent.setup() };
}

describe("LineupEditor", () => {
    it("shows the loading state, then one empty row spanning the plan", async () => {
        mockApi({ [INVITATIONS]: [] });
        renderWithProviders(<LineupEditor plan={eventPlan} performers={performers} />);

        expect(screen.getByRole("heading", { name: "Create a line up" })).toBeInTheDocument();
        expect(screen.getByText("Loading lineup invitations…")).toBeInTheDocument();

        expect(await screen.findByRole("combobox", { name: "Performer" })).toHaveValue("");
        expect(screen.queryByText("Loading lineup invitations…")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Start")).toHaveValue("2030-07-01T18:00");
        expect(screen.getByLabelText("End")).toHaveValue("2030-07-02T02:00");
        expect(screen.getByLabelText("Start")).toHaveAttribute("min", "2030-07-01T18:00");
        expect(screen.getByLabelText("End")).toHaveAttribute("max", "2030-07-02T02:00");
        expect(screen.getByText("Between 2030-07-01 18:00 and 2030-07-02 02:00")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "DJ Test" })).toBeEnabled();
        expect(screen.getByRole("option", { name: "MC Second" })).toBeEnabled();
    });

    it("renders the loaded invitations", async () => {
        await renderEditor({ [INVITATIONS]: [accepted] });

        expect(performerSelects()).toHaveLength(1);
        expect(at(performerSelects(), 0)).toHaveValue("performer-1");
        expect(at(performerSelects(), 0)).toBeEnabled();
        expect(screen.getByLabelText("Start")).toHaveValue("2030-07-01T20:00");
        expect(screen.getByLabelText("End")).toHaveValue("2030-07-01T22:00");
        expect(screen.getByText("Accepted")).toBeInTheDocument();
        expect(at(inviteButtons(), 0)).toBeEnabled();
    });

    it("shows an error line when loading fails and recovers on retry", async () => {
        let calls = 0;
        mockApi({ [INVITATIONS]: () => (calls++ === 0 ? failure() : [accepted]) });
        renderWithProviders(<LineupEditor plan={eventPlan} performers={performers} />);
        const user = userEvent.setup();

        expect(await screen.findByText("Failed to load lineup invitations.")).toBeInTheDocument();
        expect(at(performerSelects(), 0)).toHaveValue("");

        await user.click(screen.getByRole("button", { name: "Try again" }));

        await waitFor(() => expect(at(performerSelects(), 0)).toHaveValue("performer-1"));
        expect(screen.queryByText("Failed to load lineup invitations.")).not.toBeInTheDocument();
    });

    it("clamps the times to the plan range", async () => {
        await renderEditor({});
        const start = screen.getByLabelText("Start");
        const end = screen.getByLabelText("End");

        fireEvent.change(start, { target: { value: "2030-06-30T10:00" } });
        expect(start).toHaveValue("2030-07-01T18:00");

        fireEvent.change(end, { target: { value: "2030-07-03T10:00" } });
        expect(end).toHaveValue("2030-07-02T02:00");

        fireEvent.change(start, { target: { value: "2030-07-02T01:00" } });
        expect(start).toHaveValue("2030-07-02T01:00");
        fireEvent.change(end, { target: { value: "2030-07-01T20:00" } });
        expect(end).toHaveValue("2030-07-02T01:00");

        fireEvent.change(end, { target: { value: "" } });
        expect(end).toHaveValue("2030-07-02T02:00");
    });

    it("requires a performer before inviting", async () => {
        const { fetchMock, user } = await renderEditor({});

        await user.click(at(inviteButtons(), 0));

        expect(screen.getByRole("alert")).toHaveTextContent("Please select a performer and a valid time range.");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("sends the invitation and locks the row while it is pending", async () => {
        let body: unknown;
        const { user } = await renderEditor({
            [ADD]: (init: RequestInit | undefined) => {
                body = JSON.parse(String(init?.body));
                return null;
            },
        });

        await user.selectOptions(at(performerSelects(), 0), "performer-1");
        fireEvent.change(screen.getByLabelText("End"), { target: { value: "2030-07-01T22:00" } });
        await user.click(at(inviteButtons(), 0));

        expect(await screen.findByText("Pending")).toBeInTheDocument();
        await waitFor(() =>
            expect(body).toEqual({
                performerId: "performer-1",
                startTime: "2030-07-01T18:00",
                endTime: "2030-07-01T22:00",
                state: "PENDING",
            }),
        );
        expect(at(performerSelects(), 0)).toBeDisabled();
        expect(screen.getByLabelText("Start")).toBeDisabled();
        expect(screen.getByLabelText("End")).toBeDisabled();
        expect(at(inviteButtons(), 0)).toBeDisabled();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("reverts the row when the invitation fails", async () => {
        const { user } = await renderEditor({ [ADD]: failure });

        await user.selectOptions(at(performerSelects(), 0), "performer-1");
        await user.click(at(inviteButtons(), 0));

        expect(await screen.findByRole("alert")).toHaveTextContent("Failed to send the invitation.");
        expect(screen.queryByText("Pending")).not.toBeInTheDocument();
        expect(at(performerSelects(), 0)).toBeEnabled();
        expect(at(inviteButtons(), 0)).toBeEnabled();
    });

    it("adds rows and keeps performers exclusive between rows", async () => {
        const { user } = await renderEditor({});

        await user.selectOptions(at(performerSelects(), 0), "performer-1");
        await user.click(screen.getByRole("button", { name: "Add item" }));

        expect(performerSelects()).toHaveLength(2);
        expect(screen.getAllByLabelText("Start")).toHaveLength(2);
        const option = (name: string, row: number) => at(screen.getAllByRole("option", { name }), row);
        expect(option("DJ Test", 0)).toBeEnabled();
        expect(option("DJ Test", 1)).toBeDisabled();
        expect(option("MC Second", 1)).toBeEnabled();

        await user.selectOptions(at(performerSelects(), 1), "performer-2");

        expect(at(performerSelects(), 0)).toHaveValue("performer-1");
        expect(option("MC Second", 0)).toBeDisabled();
        expect(option("MC Second", 1)).toBeEnabled();
    });

    it("removes a loaded invitation from the server", async () => {
        const { fetchMock, user } = await renderEditor({ [INVITATIONS]: [accepted], [DELETE]: null });

        await user.click(at(removeButtons(), 0));

        await waitFor(() => expect(screen.queryByRole("combobox", { name: "Performer" })).not.toBeInTheDocument());
        expect(fetchMock).toHaveBeenCalledWith(
            "http://api.test/api/event-plan/plan-1/lineup-invitation/performer-1",
            expect.objectContaining({ method: "DELETE" }),
        );
    });

    it("drops rows that were never invited without calling the server", async () => {
        const { fetchMock, user } = await renderEditor({});

        await user.selectOptions(at(performerSelects(), 0), "performer-2");
        await user.click(screen.getByRole("button", { name: "Add item" }));
        expect(performerSelects()).toHaveLength(2);

        await user.click(at(removeButtons(), 0));

        expect(performerSelects()).toHaveLength(1);
        expect(at(performerSelects(), 0)).toHaveValue("");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("keeps the row when deleting fails", async () => {
        const { user } = await renderEditor({ [INVITATIONS]: [accepted], [DELETE]: failure });

        await user.click(at(removeButtons(), 0));

        expect(await screen.findByRole("alert")).toHaveTextContent("Failed to delete the lineup invitation.");
        expect(at(performerSelects(), 0)).toHaveValue("performer-1");
    });
});
