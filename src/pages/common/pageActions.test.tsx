import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { renderWithProviders } from "@/test/helpers";

import { DirectionsPill, MapPill, SharePill } from "./pageActions";

describe("page actions", () => {
    afterEach(() => {
        Reflect.deleteProperty(navigator, "clipboard");
    });

    it("link to the map, to directions, and share the current page", async () => {
        const writeText = vi.fn(async () => {});
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
        const success = vi.spyOn(toast, "success");
        renderWithProviders(
            <>
                <MapPill placeId="place-1" />
                <DirectionsPill point={{ latitude: 47.4771, longitude: 19.0621 }} />
                <SharePill title="Techno Night" />
            </>,
            { route: "/events/event-1" },
        );
        expect(screen.getByRole("link", { name: "Show on map" })).toHaveAttribute("href", "/?focus=place-1");
        expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute(
            "href",
            "https://www.google.com/maps/dir/?api=1&destination=47.4771,19.0621",
        );

        await userEvent.click(screen.getByRole("button", { name: "Share" }));
        expect(writeText).toHaveBeenCalledWith(window.location.href);
        expect(success).toHaveBeenCalledWith("Link copied");
    });
});
