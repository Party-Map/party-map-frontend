vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));

import { act, render } from "@testing-library/react";

import { setThemeChoice } from "@/lib/theme";
import { fakeContainer, fakeMap } from "@/test/mocks/leaflet";

import { starSkyImage } from "./basemap/stars";
import { Sky } from "./Sky";

const sky = () => fakeContainer.style.getPropertyValue("--map-sky");

beforeEach(() => {
    fakeMap.reset();
    setThemeChoice("light");
});

afterEach(() => setThemeChoice("system"));

describe("Sky", () => {
    it("hands the star field to the map container", () => {
        render(<Sky />);
        expect(sky()).toBe(starSkyImage());
    });

    it("keeps the same sky in both themes", () => {
        render(<Sky />);
        const light = sky();
        act(() => setThemeChoice("dark"));
        expect(sky()).toBe(light);
    });

    it("takes the sky away on unmount", () => {
        const { unmount } = render(<Sky />);
        unmount();
        expect(sky()).toBe("");
    });
});
