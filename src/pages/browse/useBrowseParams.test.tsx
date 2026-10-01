import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router";

import { readBrowseParams, useBrowseParams } from "./useBrowseParams";

function renderParams(url: string) {
    const wrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    );
    return renderHook(() => ({ params: useBrowseParams(), location: useLocation() }), { wrapper });
}

describe("readBrowseParams", () => {
    it("reads every filter and ignores values the API would reject", () => {
        const params = new URLSearchParams("search=night&kind=TECHNO&tag=ruin&genre=house&radius=25&sort=start");
        expect(readBrowseParams(params)).toEqual({
            search: "night",
            kind: "TECHNO",
            tag: "ruin",
            genre: "house",
            radius: 25,
            sort: "start",
        });
        expect(readBrowseParams(new URLSearchParams("kind=POLKA&radius=7"))).toEqual({
            search: "",
            kind: null,
            tag: "",
            genre: "",
            radius: null,
            sort: "",
        });
    });
});

describe("useBrowseParams", () => {
    it("merges patches into the URL, dropping cleared filters, without a history entry", () => {
        const { result } = renderParams("/browse/events?kind=TECHNO&radius=25");
        expect(result.current.params[0].kind).toBe("TECHNO");
        expect(result.current.location.key).toBeDefined();
        const firstKey = result.current.location.key;

        act(() => result.current.params[1]({ kind: null, search: "night", radius: 5 }));
        expect(result.current.location.search).toBe("?radius=5&search=night");
        expect(result.current.params[0]).toMatchObject({ kind: null, search: "night", radius: 5 });

        act(() => result.current.params[1]({ search: "", sort: "start" }));
        expect(result.current.location.search).toBe("?radius=5&sort=start");
        expect(result.current.location.key).not.toBe(firstKey);
    });

    it("keeps the setter stable", () => {
        const { result, rerender } = renderParams("/browse/places");
        const setter = result.current.params[1];
        rerender();
        expect(result.current.params[1]).toBe(setter);
    });
});
