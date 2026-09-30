import { act, renderHook, waitFor } from "@testing-library/react";
import { useResource } from "@/lib/hooks/useResource";

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("useResource", () => {
    it("starts loading and exposes the data once resolved", async () => {
        const { result } = renderHook(() => useResource(() => Promise.resolve("hello"), []));
        expect(result.current).toMatchObject({ loading: true, data: null, error: null });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toBe("hello");
        expect(result.current.error).toBeNull();
    });

    it("exposes errors and wraps non-Error rejections", async () => {
        const failing = deferred<string>();
        const { result } = renderHook(() => useResource(() => failing.promise, []));
        failing.reject(new Error("boom"));
        await waitFor(() => expect(result.current.error?.message).toBe("boom"));
        expect(result.current).toMatchObject({ loading: false, data: null });

        const plain = deferred<string>();
        const wrapped = renderHook(() => useResource(() => plain.promise, []));
        plain.reject("plain string");
        await waitFor(() => expect(wrapped.result.current.error).toBeInstanceOf(Error));
        expect(wrapped.result.current.error?.message).toBe("plain string");
    });

    it("reloads on demand while keeping the previous data visible", async () => {
        const second = deferred<string>();
        const loader = vi
            .fn<() => Promise<string>>()
            .mockResolvedValueOnce("first")
            .mockReturnValueOnce(second.promise);
        const { result } = renderHook(() => useResource(loader, []));
        await waitFor(() => expect(result.current.data).toBe("first"));

        act(() => result.current.reload());
        expect(loader).toHaveBeenCalledTimes(2);
        expect(result.current).toMatchObject({ loading: true, data: "first", error: null });

        await act(async () => second.resolve("second"));
        await waitFor(() => expect(result.current.data).toBe("second"));
        expect(result.current.loading).toBe(false);
    });

    it("keeps the previous data while the deps change", async () => {
        const { result, rerender } = renderHook(({ id }) => useResource(() => Promise.resolve(`data-${id}`), [id]), {
            initialProps: { id: "a" },
        });
        await waitFor(() => expect(result.current.data).toBe("data-a"));
        rerender({ id: "b" });
        expect(result.current).toMatchObject({ loading: true, data: "data-a", error: null });
        await waitFor(() => expect(result.current.data).toBe("data-b"));
        expect(result.current.loading).toBe(false);
    });

    it("ignores results that arrive after the deps changed", async () => {
        const first = deferred<string>();
        const second = deferred<string>();
        const loader = vi.fn((id: string) => (id === "a" ? first.promise : second.promise));
        const { result, rerender } = renderHook(({ id }) => useResource(() => loader(id), [id]), {
            initialProps: { id: "a" },
        });
        rerender({ id: "b" });
        expect(loader).toHaveBeenCalledTimes(2);

        await act(async () => first.resolve("stale"));
        expect(result.current).toMatchObject({ loading: true, data: null });

        await act(async () => second.resolve("fresh"));
        await waitFor(() => expect(result.current.data).toBe("fresh"));
        expect(result.current.loading).toBe(false);
    });

    it("does not load while disabled and starts once enabled", async () => {
        const loader = vi.fn(() => Promise.resolve(42));
        const { result, rerender } = renderHook(({ enabled }) => useResource(loader, [], { enabled }), {
            initialProps: { enabled: false },
        });
        expect(result.current).toMatchObject({ loading: false, data: null, error: null });
        expect(loader).not.toHaveBeenCalled();

        rerender({ enabled: true });
        expect(loader).toHaveBeenCalledTimes(1);
        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.data).toBe(42));
    });
});
