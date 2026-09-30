import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

async function advance(ms: number) {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });
}

describe("useDebouncedValue", () => {
    it("returns the initial value immediately", () => {
        const { result } = renderHook(() => useDebouncedValue("a", 300));
        expect(result.current).toBe("a");
    });

    it("updates only after the delay", async () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
            initialProps: { value: "a" },
        });
        rerender({ value: "b" });
        expect(result.current).toBe("a");
        await advance(299);
        expect(result.current).toBe("a");
        await advance(1);
        expect(result.current).toBe("b");
    });

    it("restarts the timer on every change", async () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
            initialProps: { value: "a" },
        });
        rerender({ value: "b" });
        await advance(200);
        rerender({ value: "c" });
        await advance(200);
        expect(result.current).toBe("a");
        await advance(100);
        expect(result.current).toBe("c");
    });

    it("honours a changed delay", async () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
            initialProps: { value: 1, delay: 300 },
        });
        rerender({ value: 2, delay: 50 });
        await advance(50);
        expect(result.current).toBe(2);
    });
});
