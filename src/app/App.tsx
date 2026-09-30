import { RouterProvider } from "react-router/dom";
import { HighlightProvider } from "@/app/HighlightProvider";
import { router } from "@/app/router";
import { ThemeProvider } from "@/app/ThemeProvider";
import { ToastProvider } from "@/app/ToastProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import type { AuthClient } from "@/lib/auth/keycloak";

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
