import { Menu as MenuIcon } from "lucide-react";
import { Link } from "react-router";

import { ThemeToggle } from "@/components/ThemeToggle";
import type { AdminDomain } from "@/pages/admin/domains";

import styles from "./AdminHeader.module.scss";
import { DomainSwitcher } from "./DomainSwitcher";
import { UserMenu } from "./UserMenu";

interface AdminHeaderProps {
    domains: AdminDomain[];
    current: AdminDomain | undefined;
    onOpenNavigation: () => void;
}

/** The admin area's top bar: navigation drawer button (phones), brand, domain switcher, theme and account. */
export function AdminHeader({ domains, current, onOpenNavigation }: AdminHeaderProps) {
    return (
        <header className={styles.header}>
            <a href="#admin-main" className={styles.skip}>
                Skip to content
            </a>
            <button type="button" className={styles.menuButton} onClick={onOpenNavigation} aria-label="Open navigation">
                <MenuIcon size={20} aria-hidden />
            </button>
            <Link to="/" className={styles.brand} aria-label="PartyMap: back to the map">
                <span className={styles.logo} aria-hidden>
                    PM
                </span>
                <span className={styles.wordmark}>PartyMap</span>
                <span className={styles.badge}>Admin</span>
            </Link>
            <span className={styles.slash} aria-hidden>
                /
            </span>
            <DomainSwitcher domains={domains} current={current} />
            <div className={styles.actions}>
                <ThemeToggle compact />
                <UserMenu />
            </div>
        </header>
    );
}
