import { DESKTOP_MIN_WIDTH } from "@/lib/constants";

import { BOTTOM_INSET, mapInsets, overlayTop, readSafeBottom, TOP_INSET } from "./insets";

describe("mapInsets", () => {
    it("counts the top bar at every width and the bottom bar below the desktop breakpoint", () => {
        expect(mapInsets(390, 0)).toEqual({ top: TOP_INSET, bottom: BOTTOM_INSET });
        expect(mapInsets(DESKTOP_MIN_WIDTH - 1, 0)).toEqual({ top: TOP_INSET, bottom: BOTTOM_INSET });
        expect(mapInsets(DESKTOP_MIN_WIDTH, 0)).toEqual({ top: TOP_INSET, bottom: 0 });
        expect(mapInsets(1440, 0)).toEqual({ top: TOP_INSET, bottom: 0 });
    });

    it("makes room for the device's safe area under the bottom bar once it exceeds the bar's gap", () => {
        expect(mapInsets(390, 34).bottom).toBe(BOTTOM_INSET - 12 + 34);
        expect(mapInsets(390, 5).bottom).toBe(BOTTOM_INSET);
        expect(mapInsets(1440, 34).bottom).toBe(0);
        expect(mapInsets(390)).toEqual(mapInsets(390, readSafeBottom()));
    });
});

describe("readSafeBottom", () => {
    afterEach(() => vi.restoreAllMocks());

    it("reads the --safe-bottom custom property, and is 0 when it is unset or not a length", () => {
        const computed = vi.spyOn(window, "getComputedStyle");
        const declare = (value: string) =>
            computed.mockReturnValue({ getPropertyValue: () => value } as unknown as CSSStyleDeclaration);
        declare("34px");
        expect(readSafeBottom()).toBe(34);
        declare("");
        expect(readSafeBottom()).toBe(0);
        declare("env(safe-area-inset-bottom)");
        expect(readSafeBottom()).toBe(0);
        declare("-3px");
        expect(readSafeBottom()).toBe(0);
    });
});

describe("overlayTop", () => {
    it("is the top edge of the highest overlay marked as a bottom inset, null without one", () => {
        expect(overlayTop()).toBeNull();
        const overlay = (top: number) => {
            const el = document.createElement("div");
            el.dataset.mapInset = "bottom";
            el.getBoundingClientRect = () => ({ top }) as DOMRect;
            document.body.appendChild(el);
            return el;
        };
        const a = overlay(620);
        expect(overlayTop()).toBe(620);
        const b = overlay(580);
        expect(overlayTop()).toBe(580);
        a.remove();
        b.remove();
        expect(overlayTop()).toBeNull();
    });
});
