import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

import styles from "./bars.module.scss";
import { NavActions } from "./NavActions";
import { SearchBar } from "./SearchBar";

/**
 * Fixed header. On desktop it holds the brand with the Map/Browse links, the search bar in the middle and the
 * account actions on the right; on phones it shrinks to a compact brand button plus the search bar (the links
 * and account actions move to the BottomBar), and the brand steps aside while the search is in use so the box
 * and its results get the whole width.
 */
export function TopBar() {
    const [searchParams] = useSearchParams();
    // Remount the search bar when the URL query changes so its input state resets without effects.
    const searchKey = searchParams.get("q") ?? "";
    const [searchExpanded, setSearchExpanded] = useState(false);

    return (
        <header className={styles.topWrapper}>
            <div className={styles.topBar}>
                <div className={cn(styles.lead, searchExpanded && styles.leadCollapsed)}>
                    <Link to="/" className={styles.brand} aria-label="PartyMap home">
                        <span className={styles.brandFull}>PartyMap</span>
                        <span className={styles.brandShort} aria-hidden>
                            PM
                        </span>
                    </Link>
                    <div className={styles.explore}>
                        <NavActions variant="desktop" only="explore" />
                    </div>
                </div>

                <div className={styles.search}>
                    <SearchBar key={searchKey} initialQuery={searchKey} onExpandedChange={setSearchExpanded} />
                </div>

                <div className={styles.topActions}>
                    <NavActions variant="desktop" only="account" />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
