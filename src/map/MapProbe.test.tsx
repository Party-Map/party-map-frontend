vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { render } from "@testing-library/react";

import { fakeMap } from "@/test/mocks/leaflet";

import { MapProbe } from "./MapProbe";
import { getCamera } from "./useCamera";

beforeEach(() => fakeMap.reset());

describe("MapProbe", () => {
    it("hands the map and its camera to the page while mounted", () => {
        const { unmount } = render(<MapProbe />);
        expect(window.__pmMap).toBe(fakeMap);
        expect(window.__pmCamera).toBe(getCamera(fakeMap as never));
        unmount();
        expect(window.__pmMap).toBeUndefined();
        expect(window.__pmCamera).toBeUndefined();
    });
});
