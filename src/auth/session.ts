// The browser session as the API sees it. keycloak-js holds the tokens (auth/keycloak.ts); this module knows
// whether the app believes it is signed in and notices when that stops being true: a token that cannot be refreshed,
// or a 401 answer while signed in. Then the session-ended dialog opens and the refused call waits forever, so no
// card shows an error behind the dialog. A 401 while anonymous is an ordinary error the pages already handle.
import { useSyncExternalStore } from "react";

/** Page navigation goes through here, so tests can spy on it. */
export const browser = {
    assign: (url: string) => window.location.assign(url),
    reload: () => window.location.reload(),
};

let signedIn = false;
let ended = false;
let signingIn = false;
let startSignIn: () => void = () => undefined;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

/** The auth provider registers how to start the sign-in (the Keycloak login, back to this page). */
export function registerSignIn(start: () => void): void {
    startSignIn = start;
}

/** The identity provider confirmed a signed-in user. */
export function markSignedIn(): void {
    signedIn = true;
    if (ended) {
        ended = false;
        notify();
    }
}

/** The user signed out on purpose. */
export function markSignedOut(): void {
    signedIn = false;
}

export function isSignedIn(): boolean {
    return signedIn;
}

/** The session the app was using is gone: open the session-ended dialog (once). */
export function sessionEnded(): void {
    if (!signedIn || ended) return;
    ended = true;
    notify();
}

/** Go to the sign-in, once, however many calls ask for it. */
export function signIn(): void {
    if (signingIn) return;
    signingIn = true;
    startSignIn();
}

/** A promise that never settles: the refused call waits behind the dialog instead of failing. */
export function pending<T>(): Promise<T> {
    return new Promise<T>(() => undefined);
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Whether the session-ended dialog should show. */
export function useSessionEnded(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => ended,
        () => false,
    );
}

/** Tests only: forget everything. */
export function resetSession(): void {
    signedIn = false;
    ended = false;
    signingIn = false;
    startSignIn = () => undefined;
    notify();
}
