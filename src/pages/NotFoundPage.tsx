import { Link } from "react-router";

import { pageTitle, usePageMeta } from "@/lib/seo";

import styles from "./NotFoundPage.module.scss";

const NOT_FOUND_META = { title: pageTitle("Not found"), noindex: true };

export function NotFoundPage() {
    usePageMeta(NOT_FOUND_META);
    return (
        <main className={styles.main}>
            <div className={styles.glow1} aria-hidden />
            <div className={styles.glow2} aria-hidden />
            <section className={styles.content}>
                <p className={styles.tag}>
                    <span className={styles.dot} aria-hidden />
                    Lost in the party
                </p>
                <h1 className={styles.code}>404</h1>
                <p className={styles.text}>This page didn’t make the guest list. Let’s take you back to the map.</p>
                <Link to="/" className={styles.button}>
                    Back to Map
                </Link>
            </section>
        </main>
    );
}
