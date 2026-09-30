// The typed API client. The paths, parameters and bodies come from src/api/schema.d.ts, generated from the
// backend's OpenAPI document; the auth layer registers how to get a fresh access token, which a middleware sends
// as a Bearer header on every call.
import createClient, { type Middleware } from "openapi-fetch";

import { isSignedIn, pending, sessionEnded } from "@/auth/session";
import { getEnv } from "@/lib/env";

import type { paths } from "./schema";

/** A response outside 2xx. `body` is what the API sent, parsed when it was JSON. */
export class ApiError extends Error {
    readonly status: number;
    readonly body: unknown;

    constructor(status: number, message: string, body?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

export type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider = () => Promise.resolve(null);

/** The auth layer registers how to obtain a fresh access token; the API layer stays framework-free. */
export function setTokenProvider(provider: TokenProvider): void {
    tokenProvider = provider;
}

/**
 * Sends the access token. A signed-in session that can no longer produce a token, or a 401 answer while signed in,
 * means the session ended: the dialog opens and the call waits forever instead of failing behind it.
 */
const bearer: Middleware = {
    async onRequest({ request }) {
        const wasSignedIn = isSignedIn();
        const token = await tokenProvider();
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        } else if (wasSignedIn) {
            sessionEnded();
            return pending<Request>();
        }
        return request;
    },
    onResponse({ response }) {
        if (response.status === 401 && isSignedIn()) {
            sessionEnded();
            return pending<Response>();
        }
        return response;
    },
};

// The schema's paths carry the backend's /api prefix themselves, so the client's base is whatever comes before it:
// "" on the app's own origin (PUBLIC_API_BASE=/api), or the API's origin when it lives elsewhere.
// `fetch` is looked up per call, not captured once, so a stubbed or patched global fetch is honoured.
export const client = createClient<paths>({
    baseUrl: getEnv().apiBase.replace(/\/api$/, ""),
    fetch: (request) => globalThis.fetch(request),
});
client.use(bearer);

interface Result<T> {
    data?: T;
    error?: unknown;
    response: Response;
}

/**
 * The data of a typed call, or an ApiError for a status outside 2xx. Mutations that answer with an empty or
 * status-only body resolve to whatever the API sent (usually nothing worth reading).
 */
export async function unwrap<T>(call: Promise<Result<T>>): Promise<T> {
    const { data, error, response } = await call;
    if (!response.ok) {
        const target = response.url ? ` to ${new URL(response.url).pathname}` : "";
        throw new ApiError(response.status, `Request${target} failed with ${response.status}`, error);
    }
    return data as T;
}

/**
 * A message to show for a failed call: the API's problem detail (RFC 9457 `detail` when it is a string, else
 * `title`), otherwise the fallback.
 */
export function messageOf(error: unknown, fallback: string): string {
    if (error instanceof ApiError && typeof error.body === "object" && error.body !== null) {
        const { detail, title } = error.body as { detail?: unknown; title?: unknown };
        if (typeof detail === "string" && detail) return detail;
        if (typeof title === "string" && title) return title;
    }
    return fallback;
}
