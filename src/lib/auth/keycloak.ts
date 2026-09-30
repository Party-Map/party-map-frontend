import Keycloak from "keycloak-js";
import { getEnv } from "@/lib/env";

export type UserProfile = {
    name: string;
    email: string | null;
    givenName: string | null;
    familyName: string | null;
};

export type AuthSnapshot = {
    authenticated: boolean;
    roles: string[];
    user: UserProfile | null;
};

/**
 * The only surface React code talks to. keycloak-js is wrapped so components and tests never
 * depend on the library directly.
 */
export interface AuthClient {
    init(): Promise<AuthSnapshot>;
    login(returnTo: string): Promise<void>;
    logout(returnTo: string): Promise<void>;
    getToken(): Promise<string | null>;
    accountUrl(returnTo: string): string;
    subscribe(listener: (snapshot: AuthSnapshot) => void): () => void;
}

type TokenClaims = {
    roles?: unknown;
    name?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
};

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

export function createKeycloakClient(): AuthClient {
    const env = getEnv();
    const keycloak = new Keycloak({ url: env.keycloakUrl, realm: env.keycloakRealm, clientId: env.keycloakClientId });
    const listeners = new Set<(snapshot: AuthSnapshot) => void>();
    let initPromise: Promise<AuthSnapshot> | null = null;

    const snapshot = () =>
        snapshotFromClaims(Boolean(keycloak.authenticated), keycloak.tokenParsed as TokenClaims | undefined);
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
        login(returnTo) {
            return keycloak.login({ redirectUri: `${window.location.origin}${returnTo}` });
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
