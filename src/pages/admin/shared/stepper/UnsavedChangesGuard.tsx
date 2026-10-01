import { useEffect } from "react";
import { useBlocker } from "react-router";

import { ConfirmDialog } from "@/components/ConfirmDialog";

interface UnsavedChangesGuardProps {
    /** Read when a navigation starts, so a save that navigates in the same tick is never blocked. */
    shouldBlock: () => boolean;
    /** Whether closing the tab should warn (the browser shows its own dialog). */
    dirty: boolean;
}

/** Asks before leaving a form with unsaved changes, inside the app (a dialog) and when closing the tab. */
export function UnsavedChangesGuard({ shouldBlock, dirty }: UnsavedChangesGuardProps) {
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname && shouldBlock(),
    );

    useEffect(() => {
        if (!dirty) return;
        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    return (
        <ConfirmDialog
            open={blocker.state === "blocked"}
            title="Leave without saving?"
            text="Your changes on this form will be lost."
            confirmLabel="Leave"
            onConfirm={() => blocker.proceed?.()}
            onCancel={() => blocker.reset?.()}
        />
    );
}
