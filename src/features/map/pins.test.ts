vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import type { DivIcon } from "leaflet";
import { leafletMock } from "@/test/mocks/leaflet";
import { createPinIcon, createYouAreHereIcon, getPinIcon } from "./pins";

const htmlOf = (icon: DivIcon) => String(icon.options.html);

describe("createPinIcon", () => {
    it("builds a plain pin by default", () => {
        const html = htmlOf(createPinIcon({ isActive: false, isHighlighted: false }));
        expect(html).toContain('class="pm-pin"');
        expect(html).not.toContain("pm-pin--shiny");
        expect(html).not.toContain("pm-pin--highlight");
        expect(html).not.toContain("pm-pin--active");
        expect(html).not.toContain("pm-pin__pulse");
        expect(html).toContain("pm-pin__spark--3");
        expect(html).toContain("pm-pin__tail");
        expect(leafletMock.default.divIcon).toHaveBeenLastCalledWith(
            expect.objectContaining({
                className: "pm-pin-wrapper",
                iconSize: [36, 48],
                iconAnchor: [18, 44],
                popupAnchor: [0, -38],
            }),
        );
    });

    it("adds the highlight colour, glow and pulse ring when highlighted", () => {
        const html = htmlOf(createPinIcon({ isActive: false, isHighlighted: true }));
        expect(html).toContain("pm-pin--highlight");
        expect(html).toContain("pm-pin--shiny");
        expect(html).toContain("pm-pin__pulse");
    });

    it("prefers the active colour over the highlight colour", () => {
        const html = htmlOf(createPinIcon({ isActive: true, isHighlighted: true }));
        expect(html).toContain("pm-pin--active");
        expect(html).toContain("pm-pin--shiny");
        expect(html).not.toContain("pm-pin--highlight");
    });
});

describe("getPinIcon", () => {
    it("shares one icon instance per state", () => {
        const highlighted = getPinIcon({ isActive: false, isHighlighted: true });
        expect(getPinIcon({ isActive: false, isHighlighted: true })).toBe(highlighted);
        expect(getPinIcon({ isActive: true, isHighlighted: true })).not.toBe(highlighted);
        expect(getPinIcon({ isActive: false, isHighlighted: false })).not.toBe(highlighted);
    });
});

describe("createYouAreHereIcon", () => {
    it("builds the ring, core and two waves", () => {
        const html = htmlOf(createYouAreHereIcon());
        expect(html).toContain('class="pm-you"');
        expect(html).toContain("pm-you__ring");
        expect(html).toContain("pm-you__core");
        expect(html.match(/pm-you__wave/g)).toHaveLength(3);
        expect(html).toContain("pm-you__wave--delayed");
        expect(leafletMock.default.divIcon).toHaveBeenLastCalledWith(
            expect.objectContaining({ className: "pm-you-wrapper", iconSize: [28, 28], iconAnchor: [14, 14] }),
        );
    });
});
