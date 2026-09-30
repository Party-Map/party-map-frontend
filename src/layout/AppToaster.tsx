// Where lib/toast notices appear: bottom right, coloured by kind, in the app's theme. On phones they sit above the
// bottom bar.
import { Toaster } from "sonner";

import { useTheme } from "@/lib/theme";

export function AppToaster() {
    const { theme } = useTheme();
    return (
        <Toaster
            position="bottom-right"
            richColors
            closeButton
            theme={theme}
            mobileOffset={{ bottom: "calc(var(--bottombar-h) + var(--space-6))" }}
        />
    );
}
