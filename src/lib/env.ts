export interface AppEnv {
    /** Base URL of the API including its /api prefix, without a trailing slash. */
    apiBase: string;
    /** Base path or URL of the tile server's routes (tiles and glyphs), without a trailing slash. */
    tilesBase: string;
    keycloakUrl: string;
    keycloakRealm: string;
    keycloakClientId: string;
}

const DEFAULT_API_BASE = "/api";
const DEFAULT_TILES_BASE = "/tiles";

const trimSlashes = (value: string) => value.replace(/\/+$/, "");

// Each variable is read by its full name: Rsbuild replaces import.meta.env.PUBLIC_X statically.
function required(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`);
    }
    return trimSlashes(value);
}

/** Read the public runtime configuration. Values are inlined at build time by Rsbuild. */
export function getEnv(): AppEnv {
    return {
        apiBase: trimSlashes(import.meta.env.PUBLIC_API_BASE || DEFAULT_API_BASE),
        tilesBase: trimSlashes(import.meta.env.PUBLIC_TILES_BASE || DEFAULT_TILES_BASE),
        keycloakUrl: required("PUBLIC_KEYCLOAK_URL", import.meta.env.PUBLIC_KEYCLOAK_URL),
        keycloakRealm: required("PUBLIC_KEYCLOAK_REALM", import.meta.env.PUBLIC_KEYCLOAK_REALM),
        keycloakClientId: required("PUBLIC_KEYCLOAK_CLIENT_ID", import.meta.env.PUBLIC_KEYCLOAK_CLIENT_ID),
    };
}
