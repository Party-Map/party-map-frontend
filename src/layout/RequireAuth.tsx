import type { ReactNode } from "react";
import { useLocation } from "react-router";

import { useAuth } from "@/auth/provider";
import { LoadingState } from "@/components/States";

import { PageShell } from "./PageShell";
import { SignInRequired } from "./SignInRequired";

/** Renders children only for signed-in users; shows the sign-in prompt otherwise. */
export function RequireAuth({ children, message }: { children: ReactNode; message?: string }) {
    const { status } = useAuth();
    const { pathname, search } = useLocation();

    if (status === "loading") {
        return (
            <PageShell>
                <LoadingState label="Checking your session…" />
            </PageShell>
        );
    }
    if (status === "anonymous") {
        return <SignInRequired returnTo={`${pathname}${search}`} {...(message ? { message } : {})} />;
    }
    return <>{children}</>;
}
