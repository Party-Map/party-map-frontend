import { BOTTOM_INSET, DESKTOP_MIN_WIDTH, mapInsets, TOP_INSET } from "./insets";

describe("mapInsets", () => {
    it("counts the top bar at every width and the bottom bar below the desktop breakpoint", () => {
        expect(mapInsets(390)).toEqual({ top: TOP_INSET, bottom: BOTTOM_INSET });
        expect(mapInsets(DESKTOP_MIN_WIDTH - 1)).toEqual({ top: TOP_INSET, bottom: BOTTOM_INSET });
        expect(mapInsets(DESKTOP_MIN_WIDTH)).toEqual({ top: TOP_INSET, bottom: 0 });
        expect(mapInsets(1440)).toEqual({ top: TOP_INSET, bottom: 0 });
    });
});
