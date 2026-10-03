import Keycloak from "keycloak-js";

import { getEnv } from "@/lib/env";
import { resolveTheme } from "@/lib/theme";

export interface UserProfile {
    name: string;
    email: string | null;
    givenName: string | null;
    familyName: string | null;
}

export interface AuthSnapshot {
    authenticated: boolean;
    roles: string[];
    user: UserProfile | null;
}

/**
 * The only surface React code talks to. keycloak-js is wrapped so components and tests never
 * depend on the library directly.
 */
export interface AuthClient {
    init(): Promise<AuthSnapshot>;
    login(returnTo: string): Promise<void>;
    /** Keycloak's registration page, back to `returnTo` signed in. */
    register(returnTo: string): Promise<void>;
    logout(returnTo: string): Promise<void>;
    getToken(): Promise<string | null>;
    accountUrl(returnTo: string): string;
    subscribe(listener: (snapshot: AuthSnapshot) => void): () => void;
}

interface TokenClaims {
    roles?: unknown;
    name?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
}

export function profileFromClaims(claims: TokenClaims | undefined): UserProfile | null {
    if (!claims) return null;
    const parts = [claims.given_name, claims.family_name].filter(Boolean).join(" ");
    return {
        name: claims.name || parts || claims.preferred_username || claims.email || "Unknown user",
        email: claims.email ?? null,
        givenName: claims.given_name ?? null,
        familyName: claims.family_name ?? null,
    };
}

export function snapshotFromClaims(authenticated: boolean, claims: TokenClaims | undefined): AuthSnapshot {
    if (!authenticated) return { authenticated: false, roles: [], user: null };
    const roles = Array.isArray(claims?.roles)
        ? (claims.roles as unknown[]).filter((r): r is string => typeof r === "string")
        : [];
    return { authenticated: true, roles, user: profileFromClaims(claims) };
}

const MIN_TOKEN_VALIDITY_SECONDS = 30;

/** The query parameter the login theme reads the app's theme from (party-map-keycloak-theme `login/theme.ts`). */
export const THEME_PARAM = "pm_theme";

/** The sign-in URL with the theme in effect, so Keycloak's pages match the app (light or dark). */
export function withTheme(url: string): string {
    const themed = new URL(url);
    themed.searchParams.set(THEME_PARAM, resolveTheme());
    return themed.toString();
}

export function createKeycloakClient(
    navigate: (url: string) => void = (url) => window.location.assign(url),
): AuthClient {
    const env = getEnv();
    const keycloak = new Keycloak({ url: env.keycloakUrl, realm: env.keycloakRealm, clientId: env.keycloakClientId });
    const listeners = new Set<(snapshot: AuthSnapshot) => void>();
    let initPromise: Promise<AuthSnapshot> | null = null;

    const snapshot = () => snapshotFromClaims(keycloak.authenticated, keycloak.tokenParsed as TokenClaims | undefined);
    const notify = () => listeners.forEach((l) => l(snapshot()));

    keycloak.onAuthRefreshSuccess = notify;
    keycloak.onAuthLogout = notify;
    keycloak.onTokenExpired = () => {
        keycloak.updateToken(MIN_TOKEN_VALIDITY_SECONDS).catch(() => keycloak.clearToken());
    };

    return {
        init() {
            // keycloak-js allows exactly one init per instance; React StrictMode mounts twice.
            initPromise ??= keycloak
                .init({
                    onLoad: "check-sso",
                    pkceMethod: "S256",
                    checkLoginIframe: false,
                    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
                })
                .then(() => snapshot());
            return initPromise;
        },
        // What keycloak.login() does (createLoginUrl stores the PKCE verifier, then the page leaves), plus the theme.
        async login(returnTo) {
            navigate(withTheme(await keycloak.createLoginUrl({ redirectUri: `${window.location.origin}${returnTo}` })));
        },
        async register(returnTo) {
            navigate(
                withTheme(await keycloak.createRegisterUrl({ redirectUri: `${window.location.origin}${returnTo}` })),
            );
        },
        logout(returnTo) {
            return keycloak.logout({ redirectUri: `${window.location.origin}${returnTo}` });
        },
        async getToken() {
            if (!keycloak.authenticated) return null;
            try {
                await keycloak.updateToken(MIN_TOKEN_VALIDITY_SECONDS);
            } catch {
                keycloak.clearToken();
                notify();
                return null;
            }
            return keycloak.token ?? null;
        },
        accountUrl(returnTo) {
            // Built by hand: keycloak-js can only do this after init() and throws otherwise.
            const params = new URLSearchParams({
                referrer: env.keycloakClientId,
                referrer_uri: `${window.location.origin}${returnTo}`,
            });
            return `${env.keycloakUrl}/realms/${env.keycloakRealm}/account?${params.toString()}`;
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
