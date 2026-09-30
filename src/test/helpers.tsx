import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { type Mock, vi } from "vitest";

import type { AuthClient, AuthSnapshot } from "@/auth/keycloak";
import { AuthProvider } from "@/auth/provider";
import type { Role } from "@/auth/roles";
import { HighlightProvider } from "@/layout/HighlightProvider";
import { ToastProvider } from "@/layout/ToastProvider";
import { ThemeProvider } from "@/lib/theme";

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
}

export function AppProviders({
    children,
    route = "/",
    path = "*",
    auth = ANONYMOUS,
    authPending = false,
    client,
}: ProviderOptions & { children: ReactNode }) {
    const authClient = client ?? createMockAuthClient(auth, { pending: authPending });
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider client={authClient}>
                    <HighlightProvider>
                        <MemoryRouter initialEntries={[route]}>
                            <Routes>
                                <Route path={path} element={children} />
                                <Route path="*" element={<p>other page</p>} />
                            </Routes>
                        </MemoryRouter>
                    </HighlightProvider>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

/** Render with every app provider plus a memory router. */
export function renderWithProviders(
    ui: ReactElement,
    options: ProviderOptions & Omit<RenderOptions, "wrapper"> = {},
): RenderResult & { client: MockAuthClient } {
    const { route, path, auth, authPending, client: givenClient, ...renderOptions } = options;
    const client = givenClient ?? createMockAuthClient(auth ?? ANONYMOUS, { pending: authPending ?? false });
    const result = render(ui, {
        ...renderOptions,
        wrapper: ({ children }) => (
            <AppProviders
                client={client}
                {...(route !== undefined ? { route } : {})}
                {...(path !== undefined ? { path } : {})}
            >
                {children}
            </AppProviders>
        ),
    });
    return { ...result, client };
}

/** A JSON body to answer with, null for 204, or a function computing either (or a Response). */
type RouteHandler = unknown;
type RouteFn = (init: RequestInit | undefined, url: string) => unknown;

/**
 * Stub `fetch` with a table of "METHOD /api/path" handlers. Paths are matched against the URL's
 * pathname + search. Unknown routes answer 404. Returns the fetch mock for call assertions.
 */
export function mockApi(routes: Record<string, RouteHandler>): Mock {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const parsed = new URL(url);
        const method = (init?.method ?? "GET").toUpperCase();
        const keyWithQuery = `${method} ${parsed.pathname}${parsed.search}`;
        const keyNoQuery = `${method} ${parsed.pathname}`;
        const handler = keyWithQuery in routes ? routes[keyWithQuery] : routes[keyNoQuery];

        if (handler === undefined) return new Response("not found", { status: 404 });
        const body = typeof handler === "function" ? (handler as RouteFn)(init, url) : handler;
        if (body instanceof Response) return body;
        if (body === null) return new Response(null, { status: 204 });
        return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

/** Body sent with a fetch call, parsed. */
export function requestBody(fetchMock: Mock, callIndex = 0): unknown {
    const init = fetchMock.mock.calls[callIndex]?.[1] as RequestInit | undefined;
    return typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
}
