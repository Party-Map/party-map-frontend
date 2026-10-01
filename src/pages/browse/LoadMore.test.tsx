import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoadMore } from "./LoadMore";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class FakeObserver {
    static last: FakeObserver | undefined;
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(public callback: Callback) {
        FakeObserver.last = this;
    }
}

describe("LoadMore", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        FakeObserver.last = undefined;
    });

    it("loads when scrolled into view and on click, but not while a page is loading", async () => {
        vi.stubGlobal("IntersectionObserver", FakeObserver);
        const onLoadMore = vi.fn();
        const { rerender } = render(<LoadMore hasNextPage isFetchingNextPage={false} onLoadMore={onLoadMore} />);
        expect(onLoadMore).not.toHaveBeenCalled();

        act(() => FakeObserver.last?.callback([{ isIntersecting: true }]));
        expect(onLoadMore).toHaveBeenCalledTimes(1);

        rerender(<LoadMore hasNextPage isFetchingNextPage onLoadMore={onLoadMore} />);
        expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
        expect(onLoadMore).toHaveBeenCalledTimes(1);

        rerender(<LoadMore hasNextPage isFetchingNextPage={false} onLoadMore={onLoadMore} />);
        expect(onLoadMore).toHaveBeenCalledTimes(2);

        await userEvent.click(screen.getByRole("button", { name: "Load more" }));
        expect(onLoadMore).toHaveBeenCalledTimes(3);
    });

    it("renders nothing once every page is loaded", () => {
        const { container } = render(<LoadMore hasNextPage={false} isFetchingNextPage={false} onLoadMore={() => {}} />);
        expect(container).toBeEmptyDOMElement();
    });
});
