import { RouterProvider } from "react-router/dom";

import type { AuthClient } from "@/auth/keycloak";
import { AuthProvider } from "@/auth/provider";
import { HighlightProvider } from "@/layout/HighlightProvider";
import { ToastProvider } from "@/layout/ToastProvider";
import { ThemeProvider } from "@/lib/theme";

import { router } from "./routes";

export function App({ authClient }: { authClient: AuthClient }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider client={authClient}>
                    <HighlightProvider>
                        <RouterProvider router={router} />
                    </HighlightProvider>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
