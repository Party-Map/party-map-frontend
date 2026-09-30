// The app's TanStack Query client: data refreshes when the window regains focus, and a failed read is retried
// once unless the API answered with a client error (a 404 or 403 will not change on a second try).
import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./client";

export function shouldRetry(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
    return failureCount < 1;
}

export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: true, retry: shouldRetry } },
    });
}
