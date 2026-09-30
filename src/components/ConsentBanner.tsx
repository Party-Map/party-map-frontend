import { useState } from "react";

import { Button } from "@/components/Button";
import { CONSENT_STORAGE_KEY } from "@/lib/constants";

import styles from "./ConsentBanner.module.css";

function hasStoredConsent(): boolean {
    try {
        return window.localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
    } catch {
        return true;
    }
}

function storeConsent(rejected: boolean): void {
    try {
        window.localStorage.setItem(
            CONSENT_STORAGE_KEY,
            JSON.stringify({ t: Date.now(), v: 1, ...(rejected ? { rejected } : {}) }),
        );
    } catch {
        // ignore storage errors
    }
}

/** Privacy notice shown once until the visitor accepts or rejects. */
export function ConsentBanner() {
    const [visible, setVisible] = useState(() => !hasStoredConsent());
    if (!visible) return null;

    const answer = (rejected: boolean) => {
        storeConsent(rejected);
        setVisible(false);
    };

    return (
        <div className={styles.wrapper} role="dialog" aria-labelledby="consent-title">
            <div className={styles.banner}>
                <h2 id="consent-title" className={styles.title}>
                    Privacy &amp; Cookies
                </h2>
                <p className={styles.text}>
                    This site uses cookies and local storage to remember your settings, improve functionality, and keep
                    the map working smoothly. We do not track you across other websites or use your data for
                    advertising. You can accept or reject these optional features using the buttons below.
                </p>
                <div className={styles.actions}>
                    <Button variant="secondary" size="sm" onClick={() => answer(true)}>
                        Reject
                    </Button>
                    <Button size="sm" onClick={() => answer(false)}>
                        Accept
                    </Button>
                </div>
            </div>
        </div>
    );
}
