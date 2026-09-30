import { Link, useSearchParams } from "react-router";

import { NavActions } from "@/components/NavActions";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";

import styles from "./bars.module.css";

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

/** Header variant for the admin area: brand only, no search. */
export function AdminTopBar() {
    return (
        <header className={styles.adminWrapper}>
            <div className={styles.topBar}>
                <Link to="/admin" className={styles.brand}>
                    <span className={styles.brandFull}>Admin Panel</span>
                    <span className={styles.brandShort} aria-hidden>
                        AP
                    </span>
                </Link>
                <div className={styles.topActions}>
                    <NavActions variant="desktop" />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
