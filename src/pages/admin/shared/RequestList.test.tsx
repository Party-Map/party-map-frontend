import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApiError } from "@/api/client";
import { renderWithProviders } from "@/test/helpers";

import { RequestList } from "./RequestList";
import type { InvitationRequest } from "./requests";

const pending: InvitationRequest = {
    key: "place-1:plan-1",
    eventPlanId: "plan-1",
    title: "Summer Opening",
    start: "2030-07-01T18:00:00",
    end: "2030-07-02T02:00:00",
    state: "PENDING",
    targetId: "place-1",
    targetName: "Danube Club",
};

describe("RequestList", () => {
    it("shows each request with its state and time, and the target when asked to", () => {
        renderWithProviders(<RequestList requests={[pending]} onRespond={vi.fn()} showTarget empty="None" />);

        expect(screen.getByRole("heading", { name: "Summer Opening" })).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText("For Danube Club")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Accept Summer Opening for Danube Club" })).toBeEnabled();
    });

    it("leaves the target out by default", () => {
        renderWithProviders(<RequestList requests={[pending]} onRespond={vi.fn()} empty="None" />);

        expect(screen.queryByText("For Danube Club")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reject Summer Opening" })).toBeEnabled();
    });

    it("answers a request, confirms it and blocks the buttons meanwhile", async () => {
        let finish: () => void = () => {};
        const onRespond = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
        renderWithProviders(<RequestList requests={[pending]} onRespond={onRespond} empty="None" />);

        await userEvent.click(screen.getByRole("button", { name: "Accept Summer Opening" }));

        expect(onRespond).toHaveBeenCalledWith(pending, "accept");
        expect(screen.getByRole("button", { name: "Reject Summer Opening" })).toBeDisabled();
        finish();
        expect(await screen.findByText("Invitation accepted.")).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole("button", { name: "Reject Summer Opening" })).toBeEnabled());
    });

    it("confirms a rejection", async () => {
        const onRespond = vi.fn(async () => {});
        renderWithProviders(<RequestList requests={[pending]} onRespond={onRespond} empty="None" />);

        await userEvent.click(screen.getByRole("button", { name: "Reject Summer Opening" }));

        expect(onRespond).toHaveBeenCalledWith(pending, "reject");
        expect(await screen.findByText("Invitation rejected.")).toBeInTheDocument();
    });

    it("shows the API's reason when answering fails", async () => {
        const onRespond = vi.fn(async () => {
            throw new ApiError(409, "Conflict", { detail: "The plan was already published." });
        });
        renderWithProviders(<RequestList requests={[pending]} onRespond={onRespond} empty="None" />);

        await userEvent.click(screen.getByRole("button", { name: "Accept Summer Opening" }));

        expect(await screen.findByText("The plan was already published.")).toBeInTheDocument();
    });

    it("disables the answer already given", () => {
        renderWithProviders(
            <RequestList
                requests={[
                    { ...pending, state: "ACCEPTED" },
                    { ...pending, key: "k2", title: "Other", state: "REJECTED" },
                ]}
                onRespond={vi.fn()}
                empty="None"
            />,
        );

        expect(screen.getByRole("button", { name: "Accept Summer Opening" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Reject Summer Opening" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "Reject Other" })).toBeDisabled();
    });

    it("shows the empty message without requests", () => {
        renderWithProviders(<RequestList requests={[]} onRespond={vi.fn()} empty="Nothing waiting." />);

        expect(screen.getByText("Nothing waiting.")).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
});
