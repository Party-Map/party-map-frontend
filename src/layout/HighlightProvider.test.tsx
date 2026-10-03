import { act, renderHook } from "@testing-library/react";

import { HighlightProvider, useHighlight } from "./HighlightProvider";

describe("HighlightProvider", () => {
    it("stores ids and keeps the same reference for equal arrays", () => {
        const { result } = renderHook(() => useHighlight(), { wrapper: HighlightProvider });
        expect(result.current.highlightIds).toEqual([]);

        act(() => result.current.setHighlightIds(["a", "b"]));
        const first = result.current.highlightIds;
        expect(first).toEqual(["a", "b"]);

        act(() => result.current.setHighlightIds(["a", "b"]));
        expect(result.current.highlightIds).toBe(first);

        act(() => result.current.setHighlightIds(["b", "a"]));
        expect(result.current.highlightIds).toEqual(["b", "a"]);
        expect(result.current.highlightIds).not.toBe(first);

        act(() => result.current.setHighlightIds([]));
        expect(result.current.highlightIds).toEqual([]);
    });

    it("focuses one place with a fresh request each time and clears the focus with plain highlights", () => {
        const { result } = renderHook(() => useHighlight(), { wrapper: HighlightProvider });
        expect(result.current.focus).toBeNull();

        act(() => result.current.focusPlace("a"));
        const first = result.current.focus;
        const ids = result.current.highlightIds;
        expect(first).toEqual({ id: "a" });
        expect(ids).toEqual(["a"]);

        // Picking the same place again is a new request (the card reopens) but not a new highlight set.
        act(() => result.current.focusPlace("a"));
        expect(result.current.focus).toEqual({ id: "a" });
        expect(result.current.focus).not.toBe(first);
        expect(result.current.highlightIds).toBe(ids);

        act(() => result.current.setHighlightIds(["a"]));
        expect(result.current.focus).toBeNull();
        expect(result.current.highlightIds).toBe(ids);
    });

    it("counts the user's changes in the generation and leaves republications out of it", () => {
        const { result } = renderHook(() => useHighlight(), { wrapper: HighlightProvider });
        expect(result.current.generation).toBe(0);

        act(() => result.current.setHighlightIds(["a"]));
        expect(result.current.generation).toBe(1);
        const ids = result.current.highlightIds;

        // The same ids coming back with a page (not typed) change nothing at all.
        act(() => result.current.setHighlightIds(["a"], { userAction: false }));
        expect(result.current.generation).toBe(1);
        expect(result.current.highlightIds).toBe(ids);

        act(() => result.current.setHighlightIds(["b"], { userAction: false }));
        expect(result.current.generation).toBe(1);
        expect(result.current.highlightIds).toEqual(["b"]);

        act(() => result.current.focusPlace("b"));
        expect(result.current.generation).toBe(2);
        act(() => result.current.setHighlightIds([], { userAction: false }));
        expect(result.current.generation).toBe(2);
        expect(result.current.focus).toBeNull();
        // Nothing changes, so nothing is counted, whoever asks.
        act(() => result.current.setHighlightIds([]));
        expect(result.current.generation).toBe(2);
        act(() => result.current.setHighlightIds(["c"]));
        expect(result.current.generation).toBe(3);
    });

    it("keeps the setter stable across renders", () => {
        const { result } = renderHook(() => useHighlight(), { wrapper: HighlightProvider });
        const setter = result.current.setHighlightIds;
        const focusPlace = result.current.focusPlace;
        act(() => setter(["x"]));
        act(() => focusPlace("y"));
        expect(result.current.setHighlightIds).toBe(setter);
        expect(result.current.focusPlace).toBe(focusPlace);
    });
});

describe("useHighlight", () => {
    it("throws outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => renderHook(() => useHighlight())).toThrow("useHighlight must be used inside HighlightProvider");
    });
});
