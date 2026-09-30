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

    it("keeps the setter stable across renders", () => {
        const { result } = renderHook(() => useHighlight(), { wrapper: HighlightProvider });
        const setter = result.current.setHighlightIds;
        act(() => setter(["x"]));
        expect(result.current.setHighlightIds).toBe(setter);
    });
});

describe("useHighlight", () => {
    it("throws outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => renderHook(() => useHighlight())).toThrow("useHighlight must be used inside HighlightProvider");
    });
});
