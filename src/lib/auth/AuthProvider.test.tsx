import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import { AuthProvider, useAuth } from "@/lib/auth/AuthProvider";
import type { AuthClient, AuthSnapshot } from "@/lib/auth/keycloak";
import { Role } from "@/lib/auth/roles";
import { ANONYMOUS, authenticatedSnapshot, createMockAuthClient, mockApi } from "@/test/helpers";

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function Probe() {
    const auth = useAuth();
    return (
        <div>
            <p data-testid="status">{auth.status}</p>
            <p data-testid="user">{auth.user?.name ?? "-"}</p>
            <p data-testid="roles">{auth.roles.join(",")}</p>
            <p data-testid="admin">{String(auth.isAdmin)}</p>
            <p data-testid="place-manager">{String(auth.hasRole(Role.PLACE_MANAGER))}</p>
            <p data-testid="account">{auth.accountUrl()}</p>
            <p data-testid="account-custom">{auth.accountUrl("/settings")}</p>
            <button type="button" onClick={() => auth.login()}>
                login
            </button>
            <button type="button" onClick={() => auth.login("/events/9")}>
                login to
            </button>
            <button type="button" onClick={() => auth.logout()}>
                logout
            </button>
        </div>
    );
}

function renderAuth(client: AuthClient) {
    return render(
        <AuthProvider client={client}>
            <Probe />
        </AuthProvider>,
    );
}

const status = () => screen.getByTestId("status");

afterEach(() => {
    window.history.replaceState(null, "", "/");
});

describe("AuthProvider", () => {
    it("is loading until init resolves, then anonymous", async () => {
        const init = deferred<AuthSnapshot>();
        const client: AuthClient = { ...createMockAuthClient(), init: () => init.promise };
        renderAuth(client);
        expect(status()).toHaveTextContent("loading");
        await act(async () => init.resolve(ANONYMOUS));
        expect(status()).toHaveTextContent("anonymous");
        expect(screen.getByTestId("user")).toHaveTextContent("-");
        expect(screen.getByTestId("admin")).toHaveTextContent("false");
        expect(screen.getByTestId("place-manager")).toHaveTextContent("false");
    });

    it("exposes the user and the parsed roles when authenticated", async () => {
        const snapshot: AuthSnapshot = {
            authenticated: true,
            roles: ["user", "offline_access", "place_manager_user"],
            user: { name: "Ann Lee", email: "ann@example.com", givenName: "Ann", familyName: "Lee" },
        };
        renderAuth(createMockAuthClient(snapshot));
        await waitFor(() => expect(status()).toHaveTextContent("authenticated"));
        expect(screen.getByTestId("user")).toHaveTextContent("Ann Lee");
        expect(screen.getByTestId("roles")).toHaveTextContent("user,place_manager_user");
        expect(screen.getByTestId("admin")).toHaveTextContent("true");
        expect(screen.getByTestId("place-manager")).toHaveTextContent("true");
    });

    it("is not admin with the plain user role", async () => {
        renderAuth(createMockAuthClient(authenticatedSnapshot()));
        await waitFor(() => expect(status()).toHaveTextContent("authenticated"));
        expect(screen.getByTestId("roles")).toHaveTextContent("user");
        expect(screen.getByTestId("admin")).toHaveTextContent("false");
    });

    it("logs in with the current path by default or the given return path", async () => {
        window.history.replaceState(null, "", "/events/1?tab=lineup");
        const client = createMockAuthClient();
        renderAuth(client);
        await waitFor(() => expect(status()).toHaveTextContent("anonymous"));
        await userEvent.click(screen.getByRole("button", { name: "login" }));
        expect(client.login).toHaveBeenCalledWith("/events/1?tab=lineup");
        await userEvent.click(screen.getByRole("button", { name: "login to" }));
        expect(client.login).toHaveBeenLastCalledWith("/events/9");
    });

    it("logs out to the logged-out page", async () => {
        const client = createMockAuthClient(authenticatedSnapshot());
        renderAuth(client);
        await waitFor(() => expect(status()).toHaveTextContent("authenticated"));
        await userEvent.click(screen.getByRole("button", { name: "logout" }));
        expect(client.logout).toHaveBeenCalledWith("/logged-out");
    });

    it("builds account URLs for the profile by default", async () => {
        const client = createMockAuthClient();
        renderAuth(client);
        await waitFor(() => expect(status()).toHaveTextContent("anonymous"));
        expect(screen.getByTestId("account")).toHaveTextContent("http://kc.test/account?returnTo=%2Fprofile");
        expect(screen.getByTestId("account-custom")).toHaveTextContent("http://kc.test/account?returnTo=%2Fsettings");
        expect(client.accountUrl).toHaveBeenCalledWith("/profile");
        expect(client.accountUrl).toHaveBeenCalledWith("/settings");
    });

    it("follows snapshots pushed by the client", async () => {
        const client = createMockAuthClient();
        const { unmount } = renderAuth(client);
        await waitFor(() => expect(status()).toHaveTextContent("anonymous"));
        act(() => client.emit(authenticatedSnapshot(["event_organizer_user"], "Ann")));
        expect(status()).toHaveTextContent("authenticated");
        expect(screen.getByTestId("user")).toHaveTextContent("Ann");
        expect(screen.getByTestId("admin")).toHaveTextContent("true");
        act(() => client.emit(ANONYMOUS));
        expect(status()).toHaveTextContent("anonymous");
        unmount();
        expect(() => client.emit(authenticatedSnapshot())).not.toThrow();
    });

    it("falls back to anonymous and logs when init fails", async () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        const failure = new Error("keycloak down");
        const client: AuthClient = { ...createMockAuthClient(), init: () => Promise.reject(failure) };
        renderAuth(client);
        await waitFor(() => expect(status()).toHaveTextContent("anonymous"));
        expect(error).toHaveBeenCalledWith("Authentication initialisation failed", failure);
    });

    it("ignores a snapshot that arrives after unmounting", async () => {
        const init = deferred<AuthSnapshot>();
        const client: AuthClient = { ...createMockAuthClient(), init: () => init.promise };
        const { unmount } = renderAuth(client);
        unmount();
        await act(async () => init.resolve(authenticatedSnapshot()));
        expect(screen.queryByTestId("status")).toBeNull();
    });

    it("wires the token provider so API calls carry the bearer token", async () => {
        renderAuth(createMockAuthClient(authenticatedSnapshot()));
        await waitFor(() => expect(status()).toHaveTextContent("authenticated"));
        const fetchMock = mockApi({ "GET /api/ping": { ok: true } });
        await expect(api.get("/ping")).resolves.toEqual({ ok: true });
        const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
        expect(init?.headers).toMatchObject({ Authorization: "Bearer test-token" });
    });

    it("sends no bearer token for anonymous visitors", async () => {
        renderAuth(createMockAuthClient());
        await waitFor(() => expect(status()).toHaveTextContent("anonymous"));
        const fetchMock = mockApi({ "GET /api/ping": { ok: true } });
        await api.get("/ping");
        const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
        expect(init?.headers).not.toHaveProperty("Authorization");
    });
});

describe("useAuth", () => {
    it("throws outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<Probe />)).toThrow("useAuth must be used inside AuthProvider");
    });
});
