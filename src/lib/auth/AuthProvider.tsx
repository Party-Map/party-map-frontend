import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { setTokenProvider } from "@/lib/api/client";
import type { AuthClient, AuthSnapshot, UserProfile } from "@/lib/auth/keycloak";
import { isAdmin as hasAdminRole, parseRoles, type Role } from "@/lib/auth/roles";

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

export function AuthProvider({ client, children }: { client: AuthClient; children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [snapshot, setSnapshot] = useState<AuthSnapshot>({ authenticated: false, roles: [], user: null });

    useEffect(() => {
        setTokenProvider(() => client.getToken());
        const unsubscribe = client.subscribe((next) => {
            setSnapshot(next);
            setStatus(next.authenticated ? "authenticated" : "anonymous");
        });

        let cancelled = false;
        client
            .init()
            .then((next) => {
                if (cancelled) return;
                setSnapshot(next);
                setStatus(next.authenticated ? "authenticated" : "anonymous");
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
    const currentPath = () => `${window.location.pathname}${window.location.search}`;

    const login = useCallback((returnTo?: string) => void client.login(returnTo ?? currentPath()), [client]);
    const logout = useCallback(() => void client.logout(LOGGED_OUT_PATH), [client]);
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
