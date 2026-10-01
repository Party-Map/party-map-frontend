import { CheckCircle2, Circle } from "lucide-react";

import card from "@/pages/admin/shared/card.module.scss";

import type { Readiness } from "./planReadiness";
import styles from "./PublishChecklist.module.scss";

/** What publishing still needs, as a checklist; publishing is enabled once every item is done. */
export function PublishChecklist({ readiness }: { readiness: Readiness }) {
    const { ready, items, confirmed } = readiness;
    return (
        <section className={card.card} aria-labelledby="publish-checklist">
            <div className={card.head}>
                <h2 id="publish-checklist" className={card.title}>
                    Ready to publish?
                </h2>
                <span className={styles.status} data-ready={ready || undefined}>
                    {ready ? "Ready" : "Not yet"}
                </span>
            </div>
            <ul className={styles.list}>
                {items.map((item) => (
                    <li key={item.id} className={styles.item} data-done={item.done || undefined}>
                        {item.done ? (
                            <CheckCircle2 size={20} aria-hidden className={styles.icon} />
                        ) : (
                            <Circle size={20} aria-hidden className={styles.icon} />
                        )}
                        <span className={styles.text}>
                            <span className={styles.label}>
                                {item.label}
                                <span className="sr-only">{item.done ? ": done" : ": not yet"}</span>
                            </span>
                            <span className={styles.hint}>{item.hint}</span>
                        </span>
                    </li>
                ))}
            </ul>
            <p className={styles.note}>
                {confirmed === 0
                    ? "Publishing creates the event without a lineup."
                    : `Publishing creates the event with ${confirmed} confirmed ${confirmed === 1 ? "performer" : "performers"}.`}{" "}
                The event cannot be edited afterwards.
            </p>
        </section>
    );
}
