import { isRouteErrorResponse, useRouteError } from "react-router";

import { Button, ButtonLink } from "@/components/Button";

import styles from "./ErrorPage.module.css";
import { NotFoundPage } from "./NotFoundPage";

export function describeRouteError(error: unknown): string {
    if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`.trim();
    if (error instanceof Error) return error.message;
    return "Unknown error";
}

/** Route error boundary: a 404 response shows the not-found page, anything else a recovery screen. */
export function ErrorPage() {
    const error = useRouteError();
    if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

    return (
        <main className={styles.main}>
            <h1 className={styles.title}>Something went wrong</h1>
            <p className={styles.text}>The page hit an unexpected error. Reloading usually fixes it.</p>
            <p className={styles.detail}>{describeRouteError(error)}</p>
            <div className={styles.actions}>
                <Button onClick={() => window.location.reload()}>Reload</Button>
                <ButtonLink variant="secondary" to="/">
                    Back to Map
                </ButtonLink>
            </div>
        </main>
    );
}
