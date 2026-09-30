// The app's providers around the router. The theme needs no provider: it is applied to <html> here and
// kept in step with the system preference and other tabs for the app's lifetime.
import { useEffect } from "react";
import { RouterProvider } from "react-router/dom";

import type { AuthClient } from "@/auth/keycloak";
import { AuthProvider } from "@/auth/provider";
import { HighlightProvider } from "@/layout/HighlightProvider";
import { ToastProvider } from "@/layout/ToastProvider";
import { applyTheme, watchTheme } from "@/lib/theme";

import { router } from "./routes";

export function App({ authClient }: { authClient: AuthClient }) {
    useEffect(() => {
        applyTheme();
        return watchTheme();
    }, []);

    return (
        <ToastProvider>
            <AuthProvider client={authClient}>
                <HighlightProvider>
                    <RouterProvider router={router} />
                </HighlightProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
