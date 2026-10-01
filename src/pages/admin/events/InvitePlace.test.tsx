import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { place, place2 } from "@/test/fixtures";
import { mockApi, renderWithProviders } from "@/test/helpers";

import { InvitePlace } from "./InvitePlace";

const invitable = [place, place2].map(({ id, name, address, city }) => ({ id, name, address, city }));

describe("InvitePlace", () => {
    it("lists the places except the one invited now and enables sending once one is chosen", async () => {
        mockApi({ "GET /api/event-plan/places": invitable });
        renderWithProviders(<InvitePlace planId="plan-1" currentPlaceId="place-2" />);

        const select = await screen.findByRole("combobox", { name: "Place" });
        expect(await screen.findByRole("option", { name: "A38 Hajó, Budapest" })).toBeInTheDocument();
        expect(screen.queryByRole("option", { name: /Dürer/ })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Send invitation" })).toBeDisabled();

        await userEvent.selectOptions(select, "place-1");
        expect(screen.getByRole("button", { name: "Send invitation" })).toBeEnabled();
    });

    it("sends the invitation and starts over", async () => {
        const fetchMock = mockApi({
            "GET /api/event-plan/places": invitable,
            "PUT /api/event-plan/plan-1/invite-place/place-2": null,
        });
        renderWithProviders(<InvitePlace planId="plan-1" />);
        await screen.findByRole("option", { name: /Dürer/ });
        await userEvent.selectOptions(screen.getByRole("combobox", { name: "Place" }), "place-2");

        await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));

        expect(await screen.findByText("Invitation sent. The place manager will answer it.")).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Place" })).toHaveValue("");
        expect(fetchMock.requests.some((r) => r.method === "PUT")).toBe(true);
    });

    it("shows the API's reason when the invitation fails", async () => {
        mockApi({
            "GET /api/event-plan/places": invitable,
            "PUT /api/event-plan/plan-1/invite-place/place-1": Response.json(
                { status: 403, detail: "You are not allowed to invite places to this plan." },
                { status: 403 },
            ),
        });
        renderWithProviders(<InvitePlace planId="plan-1" />);
        await screen.findByRole("option", { name: /A38/ });
        await userEvent.selectOptions(screen.getByRole("combobox", { name: "Place" }), "place-1");

        await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));

        expect(await screen.findByText("You are not allowed to invite places to this plan.")).toBeInTheDocument();
    });

    it("says when the places cannot be loaded", async () => {
        mockApi({ "GET /api/event-plan/places": () => new Response("boom", { status: 500 }) });
        renderWithProviders(<InvitePlace planId="plan-1" />);

        expect(await screen.findByText("Could not load the places you can invite.")).toBeInTheDocument();
    });
});
