import { vi } from "vitest";

import { createKeycloakClient, profileFromClaims, snapshotFromClaims } from "@/lib/auth/keycloak";

const fake = vi.hoisted(() => {
    type Handler = (() => void) | undefined;
    class FakeKeycloak {
        static instances: FakeKeycloak[] = [];
        config: unknown;
        authenticated = false;
        token: string | undefined = undefined;
        tokenParsed: Record<string, unknown> | undefined = undefined;
        onAuthRefreshSuccess: Handler = undefined;
        onAuthLogout: Handler = undefined;
        onTokenExpired: Handler = undefined;
        init = vi.fn(async (_options: unknown) => true);
        login = vi.fn(async (_options: unknown) => {});
        logout = vi.fn(async (_options: unknown) => {});
        updateToken = vi.fn(async (_minValidity: number) => true);
        clearToken = vi.fn(() => {
            this.authenticated = false;
            this.token = undefined;
            this.tokenParsed = undefined;
        });
        createAccountUrl = vi.fn((_options: unknown) => "http://kc.test/account");

        constructor(config: unknown) {
            this.config = config;
            FakeKeycloak.instances.push(this);
        }
    }
    return { FakeKeycloak };
});

vi.mock("keycloak-js", () => ({ default: fake.FakeKeycloak }));

type FakeInstance = InstanceType<typeof fake.FakeKeycloak>;

function make(setup?: (keycloak: FakeInstance) => void) {
    fake.FakeKeycloak.instances.length = 0;
    const client = createKeycloakClient();
    const keycloak = fake.FakeKeycloak.instances[0];
    if (!keycloak) throw new Error("Keycloak was not constructed");
    setup?.(keycloak);
    return { client, keycloak };
}

const anonymous = { authenticated: false, roles: [], user: null };
const origin = window.location.origin;

describe("profileFromClaims", () => {
    it("returns null without claims", () => {
        expect(profileFromClaims(undefined)).toBeNull();
    });

    it("prefers the full name, then given and family names, username and email", () => {
        expect(
            profileFromClaims({
                name: "Ann Lee",
                given_name: "Ann",
                family_name: "Lee",
                preferred_username: "ann",
                email: "a@x.io",
            }),
        ).toEqual({
            name: "Ann Lee",
            email: "a@x.io",
            givenName: "Ann",
            familyName: "Lee",
        });
        expect(profileFromClaims({ given_name: "Ann", family_name: "Lee", preferred_username: "ann" })?.name).toBe(
            "Ann Lee",
        );
        expect(profileFromClaims({ family_name: "Lee", preferred_username: "ann" })?.name).toBe("Lee");
        expect(profileFromClaims({ preferred_username: "ann", email: "a@x.io" })?.name).toBe("ann");
        expect(profileFromClaims({ email: "a@x.io" })?.name).toBe("a@x.io");
    });

    it("falls back to a generic name and null fields", () => {
        expect(profileFromClaims({})).toEqual({ name: "Unknown user", email: null, givenName: null, familyName: null });
    });
});

describe("snapshotFromClaims", () => {
    it("is anonymous when not authenticated, whatever the claims say", () => {
        expect(snapshotFromClaims(false, { roles: ["user"], name: "Ann" })).toEqual(anonymous);
    });

    it("keeps only string roles and builds the profile", () => {
        expect(snapshotFromClaims(true, { roles: ["user", 7, null, "place_manager_user"], name: "Ann" })).toEqual({
            authenticated: true,
            roles: ["user", "place_manager_user"],
            user: { name: "Ann", email: null, givenName: null, familyName: null },
        });
    });

    it("tolerates missing or malformed roles", () => {
        expect(snapshotFromClaims(true, { roles: "user" })).toMatchObject({ authenticated: true, roles: [] });
        expect(snapshotFromClaims(true, undefined)).toEqual({ authenticated: true, roles: [], user: null });
    });
});

describe("createKeycloakClient", () => {
    it("configures keycloak-js from the environment", () => {
        const { keycloak } = make();
        expect(keycloak.config).toEqual({ url: "http://kc.test", realm: "party-map", clientId: "partymap-web" });
    });

    it("initialises once with check-sso and resolves the snapshot", async () => {
        const { client, keycloak } = make((k) => {
            k.authenticated = true;
            k.tokenParsed = { roles: ["user", 7], name: "Ann" };
        });
        const first = client.init();
        const second = client.init();
        expect(second).toBe(first);
        await expect(first).resolves.toEqual({
            authenticated: true,
            roles: ["user"],
            user: { name: "Ann", email: null, givenName: null, familyName: null },
        });
        expect(keycloak.init).toHaveBeenCalledTimes(1);
        expect(keycloak.init).toHaveBeenCalledWith({
            onLoad: "check-sso",
            pkceMethod: "S256",
            checkLoginIframe: false,
            silentCheckSsoRedirectUri: `${origin}/silent-check-sso.html`,
        });
    });

    it("resolves an anonymous snapshot when nobody is signed in", async () => {
        const { client } = make();
        await expect(client.init()).resolves.toEqual(anonymous);
    });

    it("redirects to origin-prefixed paths on login and logout", async () => {
        const { client, keycloak } = make();
        await client.login("/events/1?x=1");
        expect(keycloak.login).toHaveBeenCalledWith({ redirectUri: `${origin}/events/1?x=1` });
        await client.logout("/logged-out");
        expect(keycloak.logout).toHaveBeenCalledWith({ redirectUri: `${origin}/logged-out` });
    });

    it("builds the account URL by hand with the client as referrer", () => {
        const { client, keycloak } = make();
        const url = new URL(client.accountUrl("/profile?tab=likes"));
        expect(`${url.origin}${url.pathname}`).toBe("http://kc.test/realms/party-map/account");
        expect(Object.fromEntries(url.searchParams)).toEqual({
            referrer: "partymap-web",
            referrer_uri: `${origin}/profile?tab=likes`,
        });
        expect(keycloak.createAccountUrl).not.toHaveBeenCalled();
    });

    describe("getToken", () => {
        it("is null when unauthenticated and skips the refresh", async () => {
            const { client, keycloak } = make();
            await expect(client.getToken()).resolves.toBeNull();
            expect(keycloak.updateToken).not.toHaveBeenCalled();
        });

        it("refreshes with a 30 second minimum validity and returns the token", async () => {
            const { client, keycloak } = make((k) => {
                k.authenticated = true;
                k.token = "tok-1";
            });
            await expect(client.getToken()).resolves.toBe("tok-1");
            expect(keycloak.updateToken).toHaveBeenCalledWith(30);
        });

        it("is null when keycloak holds no token", async () => {
            const { client } = make((k) => {
                k.authenticated = true;
            });
            await expect(client.getToken()).resolves.toBeNull();
        });

        it("clears the session and notifies subscribers when the refresh fails", async () => {
            const { client, keycloak } = make((k) => {
                k.authenticated = true;
                k.token = "tok-1";
            });
            keycloak.updateToken.mockRejectedValueOnce(new Error("refresh failed"));
            const listener = vi.fn();
            client.subscribe(listener);
            await expect(client.getToken()).resolves.toBeNull();
            expect(keycloak.clearToken).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(anonymous);
        });
    });

    it("notifies subscribers on refresh and logout events until unsubscribed", () => {
        const { client, keycloak } = make();
        const listener = vi.fn();
        const unsubscribe = client.subscribe(listener);

        keycloak.authenticated = true;
        keycloak.tokenParsed = { roles: ["user"], preferred_username: "ann" };
        keycloak.onAuthRefreshSuccess?.();
        expect(listener).toHaveBeenLastCalledWith({
            authenticated: true,
            roles: ["user"],
            user: { name: "ann", email: null, givenName: null, familyName: null },
        });

        keycloak.authenticated = false;
        keycloak.tokenParsed = undefined;
        keycloak.onAuthLogout?.();
        expect(listener).toHaveBeenLastCalledWith(anonymous);
        expect(listener).toHaveBeenCalledTimes(2);

        unsubscribe();
        keycloak.onAuthLogout?.();
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it("refreshes an expired token and clears it when the refresh fails", async () => {
        const { keycloak } = make();
        keycloak.onTokenExpired?.();
        expect(keycloak.updateToken).toHaveBeenCalledWith(30);
        await Promise.resolve();
        expect(keycloak.clearToken).not.toHaveBeenCalled();

        keycloak.updateToken.mockRejectedValueOnce(new Error("expired"));
        keycloak.onTokenExpired?.();
        await vi.waitFor(() => expect(keycloak.clearToken).toHaveBeenCalledTimes(1));
    });
});
