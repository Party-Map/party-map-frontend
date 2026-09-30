import { act, renderHook } from "@testing-library/react";

import {
    browser,
    isSignedIn,
    markSignedIn,
    markSignedOut,
    pending,
    registerSignIn,
    sessionEnded,
    signIn,
    useSessionEnded,
} from "./session";

describe("session", () => {
    it("tracks whether the app is signed in", () => {
        expect(isSignedIn()).toBe(false);
        markSignedIn();
        expect(isSignedIn()).toBe(true);
        markSignedOut();
        expect(isSignedIn()).toBe(false);
    });

    it("ignores an ended session while anonymous", () => {
        const { result } = renderHook(() => useSessionEnded());
        act(() => sessionEnded());
        expect(result.current).toBe(false);
    });

    it("reports an ended session while signed in, until the user signs in again", () => {
        markSignedIn();
        const { result } = renderHook(() => useSessionEnded());
        expect(result.current).toBe(false);

        act(() => sessionEnded());
        expect(result.current).toBe(true);
        act(() => sessionEnded());
        expect(result.current).toBe(true);

        act(() => markSignedIn());
        expect(result.current).toBe(false);
    });

    it("starts the registered sign-in once, however often it is asked", () => {
        const start = vi.fn();
        registerSignIn(start);
        signIn();
        signIn();
        expect(start).toHaveBeenCalledTimes(1);
    });

    it("does nothing when no sign-in is registered", () => {
        expect(() => signIn()).not.toThrow();
    });

    it("hands out promises that never settle", async () => {
        const settled = vi.fn();
        void pending<string>().then(settled, settled);
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(settled).not.toHaveBeenCalled();
    });

    it("navigates through the browser object", () => {
        const location = { assign: vi.fn(), reload: vi.fn() };
        vi.stubGlobal("location", location);
        try {
            browser.assign("/somewhere");
            browser.reload();
        } finally {
            vi.unstubAllGlobals();
        }
        expect(location.assign).toHaveBeenCalledWith("/somewhere");
        expect(location.reload).toHaveBeenCalled();
    });
});
