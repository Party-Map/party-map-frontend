import { act, screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";

import { StickyTitle } from "./StickyTitle";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class FakeObserver {
    static last: FakeObserver | undefined;
    static options: IntersectionObserverInit | undefined;
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(
        public callback: Callback,
        options?: IntersectionObserverInit,
    ) {
        FakeObserver.last = this;
        FakeObserver.options = options;
    }
}

describe("StickyTitle", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        FakeObserver.last = undefined;
    });

    it("appears once the sentinel has scrolled under the top bar and hides again when it is back", () => {
        vi.stubGlobal("IntersectionObserver", FakeObserver);
        renderWithProviders(<StickyTitle title="Techno Night" action={<button type="button">Map</button>} />);
        const bar = screen.getByText("Techno Night").parentElement!;
        expect(bar).toHaveClass("bar");
        expect(bar).not.toHaveClass("visible");
        expect(bar).toHaveAttribute("aria-hidden", "true");
        expect(FakeObserver.options?.rootMargin).toBe("-72px 0px 0px 0px");

        act(() => FakeObserver.last?.callback([{ isIntersecting: false }]));
        expect(bar).toHaveClass("visible");
        expect(bar).toHaveAttribute("aria-hidden", "false");
        expect(screen.getByRole("button", { name: "Map" }).parentElement).toHaveClass("action");

        act(() => FakeObserver.last?.callback([{ isIntersecting: true }]));
        expect(bar).not.toHaveClass("visible");
    });

    it("stays hidden where the browser cannot observe", () => {
        vi.stubGlobal("IntersectionObserver", undefined);
        renderWithProviders(<StickyTitle title="Techno Night" />);
        expect(screen.getByText("Techno Night").parentElement).not.toHaveClass("visible");
    });
});
