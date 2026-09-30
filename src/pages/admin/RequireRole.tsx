import { type ReactNode, useEffect } from "react";
import { useLocation } from "react-router";

import { useAuth } from "@/auth/provider";
import type { Role } from "@/auth/roles";
import { LoadingState } from "@/components/States";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * Admin page guard: anonymous visitors are sent to Keycloak, users without the role get a 404
 * (the page does not exist for them), everyone else sees the children.
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
    const { status, hasRole, login } = useAuth();
    const { pathname, search } = useLocation();
    const anonymous = status === "anonymous";

    useEffect(() => {
        if (anonymous) login(`${pathname}${search}`);
    }, [anonymous, login, pathname, search]);

    if (status !== "authenticated") return <LoadingState label="Checking your access…" />;
    if (!hasRole(role)) return <NotFoundPage />;
    return <>{children}</>;
}
