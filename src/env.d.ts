// Build-time public configuration. Rsbuild inlines PUBLIC_* values (see rsbuild.config.ts).
interface ImportMetaEnv {
    /** Base URL of the API including its /api prefix; defaults to "/api" on the app's own origin. */
    readonly PUBLIC_API_BASE?: string;
    readonly PUBLIC_KEYCLOAK_URL?: string;
    readonly PUBLIC_KEYCLOAK_REALM?: string;
    readonly PUBLIC_KEYCLOAK_CLIENT_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
