import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/helpers";

import { LocationChip } from "./LocationChip";

type Success = (position: { coords: { latitude: number; longitude: number } }) => void;
type Failure = (error: { code: number }) => void;

function stubGeolocation(answer: (ok: Success, fail: Failure) => void) {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: answer } });
}

describe("LocationChip", () => {
    afterEach(() => {
        Reflect.deleteProperty(navigator, "geolocation");
    });

    it("offers the device position and shows it is in use once granted", async () => {
        stubGeolocation((ok) => ok({ coords: { latitude: 47.5, longitude: 19.1 } }));
        renderWithProviders(<LocationChip />);
        const chip = screen.getByRole("button", { name: "Budapest · Use my location", pressed: false });

        await userEvent.click(chip);
        expect(screen.getByRole("button", { name: "Near you", pressed: true })).toBeInTheDocument();
    });

    it("waits while the browser looks the position up", async () => {
        stubGeolocation(() => {});
        renderWithProviders(<LocationChip />);
        await userEvent.click(screen.getByRole("button", { name: "Budapest · Use my location" }));
        expect(screen.getByRole("button", { name: "Locating…" })).toBeDisabled();
    });

    it("explains a blocked permission when asked again", async () => {
        stubGeolocation((_ok, fail) => fail({ code: 1 }));
        renderWithProviders(<LocationChip />);
        const chip = screen.getByRole("button", { name: "Budapest · Use my location" });
        await userEvent.click(chip);
        expect(screen.queryByText(/blocked/)).toBeNull();

        await userEvent.click(chip);
        expect(
            await screen.findByText("Location is blocked for this site in your browser settings."),
        ).toBeInTheDocument();
    });
});
