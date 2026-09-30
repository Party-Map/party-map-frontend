import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { setTokenProvider } from "@/api/client";

import type { AuthClient, AuthSnapshot, UserProfile } from "./keycloak";
import { isAdmin as hasAdminRole, parseRoles, type Role } from "./roles";
import { markSignedIn, markSignedOut, registerSignIn } from "./session";

export type AuthStatus = "loading" | "anonymous" | "authenticated";

export interface AuthContextValue {
    status: AuthStatus;
    user: UserProfile | null;
    roles: Role[];
    hasRole: (role: Role) => boolean;
    isAdmin: boolean;
    login: (returnTo?: string) => void;
    logout: () => void;
    accountUrl: (returnTo?: string) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LOGGED_OUT_PATH = "/logged-out";

const currentPath = () => `${window.location.pathname}${window.location.search}`;

export function AuthProvider({ client, children }: { client: AuthClient; children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [snapshot, setSnapshot] = useState<AuthSnapshot>({ authenticated: false, roles: [], user: null });

    useEffect(() => {
        setTokenProvider(() => client.getToken());
        registerSignIn(() => void client.login(currentPath()));
        // Losing the session (a failed token refresh) does not sign out here: the session module notices it on the
        // next API call and asks the user what to do.
        const apply = (next: AuthSnapshot) => {
            if (next.authenticated) markSignedIn();
            setSnapshot(next);
            setStatus(next.authenticated ? "authenticated" : "anonymous");
        };
        const unsubscribe = client.subscribe(apply);

        let cancelled = false;
        client
            .init()
            .then((next) => {
                if (!cancelled) apply(next);
            })
            .catch((error: unknown) => {
                console.error("Authentication initialisation failed", error);
                if (!cancelled) setStatus("anonymous");
            });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [client]);

    const roles = useMemo(() => parseRoles(snapshot.roles), [snapshot.roles]);

    const login = useCallback((returnTo?: string) => void client.login(returnTo ?? currentPath()), [client]);
    const logout = useCallback(() => {
        markSignedOut();
        void client.logout(LOGGED_OUT_PATH);
    }, [client]);
    const accountUrl = useCallback((returnTo?: string) => client.accountUrl(returnTo ?? "/profile"), [client]);

    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            user: snapshot.user,
            roles,
            hasRole: (role) => roles.includes(role),
            isAdmin: hasAdminRole(roles),
            login,
            logout,
            accountUrl,
        }),
        [status, snapshot.user, roles, login, logout, accountUrl],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
