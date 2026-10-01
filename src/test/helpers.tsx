import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { type ReactElement, type ReactNode, useState } from "react";
import { createMemoryRouter, MemoryRouter, Route, Routes } from "react-router";
import { RouterProvider } from "react-router/dom";
import { type Mock, vi } from "vitest";

import type { AuthClient, AuthSnapshot } from "@/auth/keycloak";
import { AuthProvider } from "@/auth/provider";
import type { Role } from "@/auth/roles";
import { AppToaster } from "@/layout/AppToaster";
import { HighlightProvider } from "@/layout/HighlightProvider";

export type MockAuthClient = AuthClient & {
    emit: (snapshot: AuthSnapshot) => void;
    login: Mock<AuthClient["login"]>;
    logout: Mock<AuthClient["logout"]>;
    getToken: Mock<AuthClient["getToken"]>;
};

export const ANONYMOUS: AuthSnapshot = { authenticated: false, roles: [], user: null };

export function authenticatedSnapshot(roles: Role[] = [], name = "Test User"): AuthSnapshot {
    return {
        authenticated: true,
        roles: ["user", ...roles],
        user: { name, email: "test@example.com", givenName: "Test", familyName: "User" },
    };
}

/** In-memory auth client; `init` resolves with `snapshot` (or never, when `pending`). */
export function createMockAuthClient(
    snapshot: AuthSnapshot = ANONYMOUS,
    options: { pending?: boolean } = {},
): MockAuthClient {
    const listeners = new Set<(s: AuthSnapshot) => void>();
    return {
        init: vi.fn(() => (options.pending ? new Promise<AuthSnapshot>(() => {}) : Promise.resolve(snapshot))),
        login: vi.fn(async () => {}),
        logout: vi.fn(async () => {}),
        getToken: vi.fn(async () => (snapshot.authenticated ? "test-token" : null)),
        accountUrl: vi.fn((returnTo: string) => `http://kc.test/account?returnTo=${encodeURIComponent(returnTo)}`),
        subscribe: vi.fn((listener: (s: AuthSnapshot) => void) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }),
        emit: (next) => listeners.forEach((l) => l(next)),
    };
}

interface ProviderOptions {
    /** Initial URL for the memory router. */
    route?: string;
    /** Route pattern to mount the element on (for pages that read params). */
    path?: string;
    auth?: AuthSnapshot;
    authPending?: boolean;
    client?: MockAuthClient;
    queryClient?: QueryClient;
    /**
     * Mount on a data router (createMemoryRouter) instead of MemoryRouter: needed by `useBlocker`. Other paths render
     * "other page", like the default router.
     */
    dataRouter?: boolean;
}

/** A fresh cache per test; failures surface at once instead of being retried. */
export function createTestQueryClient(): QueryClient {
    return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

export function AppProviders({
    children,
    route = "/",
    path = "*",
    auth = ANONYMOUS,
    authPending = false,
    client,
    queryClient,
    dataRouter = false,
}: ProviderOptions & { children: ReactNode }) {
    const authClient = client ?? createMockAuthClient(auth, { pending: authPending });
    const [cache] = useState(() => queryClient ?? createTestQueryClient());
    const [router] = useState(() =>
        dataRouter
            ? createMemoryRouter(
                  [
                      { path, element: children },
                      { path: "*", element: <p>other page</p> },
                  ],
                  { initialEntries: [route] },
              )
            : null,
    );
    return (
        <>
            <AuthProvider client={authClient}>
                <QueryClientProvider client={cache}>
                    <HighlightProvider>
                        {router ? (
                            <RouterProvider router={router} />
                        ) : (
                            <MemoryRouter initialEntries={[route]}>
                                <Routes>
                                    <Route path={path} element={children} />
                                    <Route path="*" element={<p>other page</p>} />
                                </Routes>
                            </MemoryRouter>
                        )}
                    </HighlightProvider>
                </QueryClientProvider>
            </AuthProvider>
            <AppToaster />
        </>
    );
}

/** Render with every app provider plus a memory router. */
export function renderWithProviders(
    ui: ReactElement,
    options: ProviderOptions & Omit<RenderOptions, "wrapper"> = {},
): RenderResult & { client: MockAuthClient; queryClient: QueryClient } {
    const {
        route,
        path,
        auth,
        authPending,
        client: givenClient,
        queryClient: givenCache,
        dataRouter,
        ...renderOptions
    } = options;
    const client = givenClient ?? createMockAuthClient(auth ?? ANONYMOUS, { pending: authPending ?? false });
    const queryClient = givenCache ?? createTestQueryClient();
    const result = render(ui, {
        ...renderOptions,
        wrapper: ({ children }) => (
            <AppProviders
                client={client}
                queryClient={queryClient}
                {...(route !== undefined ? { route } : {})}
                {...(path !== undefined ? { path } : {})}
                {...(dataRouter !== undefined ? { dataRouter } : {})}
            >
                {children}
            </AppProviders>
        ),
    });
    return { ...result, client, queryClient };
}

/** A request the app sent, as the API would see it. `body` is parsed when it is JSON. */
export interface SentRequest {
    method: string;
    url: string;
    headers: Headers;
    body: unknown;
}

/** A JSON body to answer with, null for 204, or a function computing either (or a Response). */
type RouteHandler = unknown;
type RouteFn = (request: SentRequest) => unknown;

export type ApiMock = Mock<typeof fetch> & { requests: SentRequest[] };

async function readBody(request: Request): Promise<unknown> {
    const text = await request.text();
    if (!text) return undefined;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/**
 * Stub `fetch` with a table of "METHOD /api/path" handlers. Paths are matched against the URL's
 * pathname + search. Unknown routes answer 404. Every request is recorded in `requests`, in order.
 */
export function mockApi(routes: Record<string, RouteHandler>): ApiMock {
    const requests: SentRequest[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        const sent: SentRequest = {
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: undefined,
        };
        requests.push(sent);
        sent.body = await readBody(request);

        const parsed = new URL(request.url);
        const keyWithQuery = `${sent.method} ${parsed.pathname}${parsed.search}`;
        const keyNoQuery = `${sent.method} ${parsed.pathname}`;
        const handler = keyWithQuery in routes ? routes[keyWithQuery] : routes[keyNoQuery];

        if (handler === undefined) return new Response("not found", { status: 404 });
        // A handler may answer later (return a promise) to hold a request in flight.
        const body: unknown = typeof handler === "function" ? await (handler as RouteFn)(sent) : handler;
        if (body instanceof Response) return body;
        if (body === null) return new Response(null, { status: 204 });
        return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    return Object.assign(fetchMock, { requests });
}

/** The parsed body of a recorded request. */
export function requestBody(fetchMock: ApiMock, index = 0): unknown {
    return fetchMock.requests[index]?.body;
}
