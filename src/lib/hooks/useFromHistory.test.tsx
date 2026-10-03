import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useNavigate } from "react-router";

import { useFromHistory } from "./useFromHistory";

const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
);

describe("useFromHistory", () => {
    it("is true on the first page and after going back or forward, false after a link", () => {
        const { result } = renderHook(() => ({ fromHistory: useFromHistory(), navigate: useNavigate() }), { wrapper });
        expect(result.current.fromHistory).toBe(true);

        act(() => void result.current.navigate("/browse"));
        expect(result.current.fromHistory).toBe(false);
        act(() => void result.current.navigate(-1));
        expect(result.current.fromHistory).toBe(true);
        act(() => void result.current.navigate(1));
        expect(result.current.fromHistory).toBe(true);
        act(() => void result.current.navigate("/likes", { replace: true }));
        expect(result.current.fromHistory).toBe(false);
    });
});
