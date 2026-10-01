import { Link, useSearchParams } from "react-router";

import { ThemeToggle } from "@/components/ThemeToggle";

import styles from "./bars.module.scss";
import { NavActions } from "./NavActions";
import { SearchBar } from "./SearchBar";

/**
 * Fixed header. On desktop it holds the brand, the search bar and account actions; on phones it
 * shrinks to a compact brand button plus the search bar (account actions move to the BottomBar).
 */
export function TopBar() {
    const [searchParams] = useSearchParams();
    // Remount the search bar when the URL query changes so its input state resets without effects.
    const searchKey = searchParams.get("q") ?? "";

    return (
        <header className={styles.topWrapper}>
            <div className={styles.topBar}>
                <Link to="/" className={styles.brand} aria-label="PartyMap home">
                    <span className={styles.brandFull}>PartyMap</span>
                    <span className={styles.brandShort} aria-hidden>
                        PM
                    </span>
                </Link>

                <div className={styles.search}>
                    <SearchBar key={searchKey} initialQuery={searchKey} />
                </div>

                <div className={styles.topActions}>
                    <NavActions variant="desktop" />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
