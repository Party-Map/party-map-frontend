import { NavActions } from "@/components/NavActions";
import { ThemeToggle } from "@/components/ThemeToggle";

import styles from "./bars.module.css";

/** Phone-only navigation bar pinned to the bottom of the screen. */
export function BottomBar() {
    return (
        <nav className={styles.bottomWrapper} aria-label="Mobile navigation">
            <div className={styles.bottomBar}>
                <NavActions variant="mobile" />
                <div className={styles.bottomTheme}>
                    <ThemeToggle compact />
                </div>
            </div>
        </nav>
    );
}
