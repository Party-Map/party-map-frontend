// Shown when the session the app was using ended (token refresh failed, or the API answered 401 while signed in).
// It cannot be dismissed: the page's data would be stale, so the way on is to sign in again or reload.
import { Button } from "@/components/Button";
import { AlertDialog } from "@/components/primitives";

import { browser, signIn, useSessionEnded } from "./session";

export function SessionEndedDialog() {
    const ended = useSessionEnded();
    return (
        <AlertDialog
            open={ended}
            title="Your session has ended"
            description="Sign in again to continue where you left off, or refresh the page to browse signed out."
        >
            <Button variant="secondary" onClick={browser.reload}>
                Refresh the page
            </Button>
            <Button onClick={signIn}>Sign in</Button>
        </AlertDialog>
    );
}
