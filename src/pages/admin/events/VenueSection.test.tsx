import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { eventPlan, place } from "@/test/fixtures";
import { mockApi, renderWithProviders } from "@/test/helpers";

import { VenueSection } from "./VenueSection";

const invitable = [{ id: place.id, name: place.name, address: place.address, city: place.city }];

describe("VenueSection", () => {
    it("offers the place picker when no place is invited", async () => {
        mockApi({ "GET /api/event-plan/places": invitable });
        renderWithProviders(<VenueSection plan={eventPlan} />);

        expect(await screen.findByRole("combobox", { name: "Place" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /different place/ })).not.toBeInTheDocument();
    });

    it("shows the invited place with its answer and hides the picker behind a toggle", async () => {
        mockApi({ "GET /api/event-plan/places": invitable });
        renderWithProviders(<VenueSection plan={{ ...eventPlan, placeInvitation: { state: "PENDING", place } }} />);

        expect(screen.getByText("A38 Hajó")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText("The place manager has not answered yet.")).toBeInTheDocument();
        expect(screen.queryByRole("combobox", { name: "Place" })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Invite a different place instead" }));

        expect(await screen.findByRole("combobox", { name: "Place" })).toBeInTheDocument();
    });

    it("explains an acceptance and a refusal", () => {
        mockApi({ "GET /api/event-plan/places": invitable });
        const { rerender } = renderWithProviders(
            <VenueSection plan={{ ...eventPlan, placeInvitation: { state: "ACCEPTED", place } }} />,
        );
        expect(screen.getByText("The place agreed to host the event.")).toBeInTheDocument();

        rerender(<VenueSection plan={{ ...eventPlan, placeInvitation: { state: "REJECTED", place } }} />);
        expect(screen.getByText("The place declined. Invite another one.")).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Place" })).toBeInTheDocument();
    });
});
