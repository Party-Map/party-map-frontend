import { NavLink, Outlet } from "react-router";

import text from "@/components/typography.module.scss";
import { PageShell } from "@/layout/PageShell";
import { pageTitle, usePageMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

import styles from "./BrowsePage.module.scss";

const TABS = [
    { to: "/browse/events", label: "Events" },
    { to: "/browse/places", label: "Places" },
    { to: "/browse/performers", label: "Performers" },
];

const BROWSE_META = { title: pageTitle("Browse"), canonicalPath: "/browse/events" };

/** The list side of the app: a segmented switch between the three lists, each with its own filters. */
export function BrowsePage() {
    usePageMeta(BROWSE_META);
    return (
        <PageShell backTo={null}>
            <div className={styles.header}>
                <h1 className={text.pageTitle}>Browse</h1>
                <nav className={styles.tabs} aria-label="Browse sections">
                    {TABS.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) => cn(styles.tab, isActive && styles.active)}
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className={styles.panel}>
                <Outlet />
            </div>
        </PageShell>
    );
}
