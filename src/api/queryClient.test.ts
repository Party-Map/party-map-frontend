import { ApiError } from "./client";
import { createQueryClient, shouldRetry } from "./queryClient";

describe("shouldRetry", () => {
    it("retries a network or server failure once", () => {
        expect(shouldRetry(0, new TypeError("fetch failed"))).toBe(true);
        expect(shouldRetry(0, new ApiError(503, "down"))).toBe(true);
        expect(shouldRetry(1, new ApiError(503, "down"))).toBe(false);
    });

    it("never retries a client error", () => {
        expect(shouldRetry(0, new ApiError(404, "missing"))).toBe(false);
        expect(shouldRetry(0, new ApiError(403, "forbidden"))).toBe(false);
    });
});

describe("createQueryClient", () => {
    it("refetches on window focus and uses the retry rule", () => {
        const { queries } = createQueryClient().getDefaultOptions();
        expect(queries?.refetchOnWindowFocus).toBe(true);
        expect(queries?.retry).toBe(shouldRetry);
    });
});
