import { getEnv } from "./env";

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("getEnv", () => {
    it("reads the public configuration", () => {
        expect(getEnv()).toEqual({
            apiBase: "http://api.test/api",
            tilesBase: "/tiles",
            keycloakUrl: "http://kc.test",
            keycloakRealm: "party-map",
            keycloakClientId: "partymap-web",
        });
    });

    it("strips trailing slashes", () => {
        vi.stubEnv("PUBLIC_API_BASE", "http://api.test/api///");
        vi.stubEnv("PUBLIC_KEYCLOAK_URL", "http://kc.test/");
        const env = getEnv();
        expect(env.apiBase).toBe("http://api.test/api");
        expect(env.keycloakUrl).toBe("http://kc.test");
    });

    it("calls the API on the app origin when no base is configured", () => {
        vi.stubEnv("PUBLIC_API_BASE", "");
        expect(getEnv().apiBase).toBe("/api");
    });

    it("loads the tiles from the app origin unless a base is configured", () => {
        vi.stubEnv("PUBLIC_TILES_BASE", "");
        expect(getEnv().tilesBase).toBe("/tiles");
        vi.stubEnv("PUBLIC_TILES_BASE", "https://tiles.test/tiles/");
        expect(getEnv().tilesBase).toBe("https://tiles.test/tiles");
    });

    it.each(["PUBLIC_KEYCLOAK_URL", "PUBLIC_KEYCLOAK_REALM", "PUBLIC_KEYCLOAK_CLIENT_ID"] as const)(
        "requires %s",
        (name) => {
            vi.stubEnv(name, "");
            expect(() => getEnv()).toThrow(`Missing environment variable ${name}`);
        },
    );
});
