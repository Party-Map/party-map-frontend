// The app's providers around the router. The theme needs no provider: it is applied to <html> here and
// kept in step with the system preference and other tabs for the app's lifetime.
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { RouterProvider } from "react-router/dom";

import { createQueryClient } from "@/api/queryClient";
import type { AuthClient } from "@/auth/keycloak";
import { AuthProvider } from "@/auth/provider";
import { SessionEndedDialog } from "@/auth/SessionEndedDialog";
import { AppToaster } from "@/layout/AppToaster";
import { HighlightProvider } from "@/layout/HighlightProvider";
import { LocationProvider } from "@/layout/LocationProvider";
import { applyTheme, watchTheme } from "@/lib/theme";

import { router } from "./routes";

export function App({ authClient }: { authClient: AuthClient }) {
    const [queryClient] = useState(createQueryClient);

    useEffect(() => {
        applyTheme();
        return watchTheme();
    }, []);

    return (
        <>
            <AuthProvider client={authClient}>
                <QueryClientProvider client={queryClient}>
                    <HighlightProvider>
                        <LocationProvider>
                            <RouterProvider router={router} />
                        </LocationProvider>
                    </HighlightProvider>
                    <SessionEndedDialog />
                </QueryClientProvider>
            </AuthProvider>
            <AppToaster />
        </>
    );
}
