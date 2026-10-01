import { act, render, screen } from "@testing-library/react";

import { useInView } from "./useInView";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class FakeObserver {
    static instances: FakeObserver[] = [];
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(public callback: Callback) {
        FakeObserver.instances.push(this);
    }
}

function Probe() {
    const [ref, inView, supported] = useInView();
    return (
        <div ref={ref}>
            {inView === null ? "unknown" : inView ? "in view" : "out of view"} ({supported ? "observed" : "unobserved"})
        </div>
    );
}

describe("useInView", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        FakeObserver.instances = [];
    });

    it("follows the observer's entries and disconnects on unmount", () => {
        vi.stubGlobal("IntersectionObserver", FakeObserver);
        const { unmount } = render(<Probe />);
        expect(screen.getByText("unknown (observed)")).toBeInTheDocument();
        const observer = FakeObserver.instances[0]!;
        expect(observer.observe).toHaveBeenCalledTimes(1);

        act(() => observer.callback([{ isIntersecting: true }]));
        expect(screen.getByText("in view (observed)")).toBeInTheDocument();
        act(() => observer.callback([{ isIntersecting: false }]));
        expect(screen.getByText("out of view (observed)")).toBeInTheDocument();
        act(() => observer.callback([]));
        expect(screen.getByText("out of view (observed)")).toBeInTheDocument();

        unmount();
        expect(observer.disconnect).toHaveBeenCalledTimes(1);
    });

    it("stays out of view where IntersectionObserver is missing", () => {
        vi.stubGlobal("IntersectionObserver", undefined);
        render(<Probe />);
        expect(screen.getByText("unknown (unobserved)")).toBeInTheDocument();
        expect(FakeObserver.instances).toHaveLength(0);
    });
});
