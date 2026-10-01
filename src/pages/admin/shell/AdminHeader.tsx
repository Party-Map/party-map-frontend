import { Menu as MenuIcon } from "lucide-react";
import { Link } from "react-router";

import { ThemeToggle } from "@/components/ThemeToggle";
import type { AdminDomain } from "@/pages/admin/domains";

import styles from "./AdminHeader.module.scss";
import { DomainSwitcher } from "./DomainSwitcher";
import { EntitySwitcher } from "./EntitySwitcher";
import type { EntityItem } from "./useAdminEntities";
import { UserMenu } from "./UserMenu";

interface AdminHeaderProps {
    domains: AdminDomain[];
    current: AdminDomain | undefined;
    /** For domains whose items have their own admin area: the items and the one in view. */
    entities?: { items: EntityItem[] | undefined; currentId: string | undefined; currentName: string | undefined };
    onOpenNavigation: () => void;
}

/** The admin area's top bar: navigation drawer button (phones), brand, domain switcher, theme and account. */
export function AdminHeader({ domains, current, entities, onOpenNavigation }: AdminHeaderProps) {
    const showEntities = Boolean(current?.entity && entities);
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
            <span className={styles.slash} data-lead={showEntities || undefined} aria-hidden>
                /
            </span>
            <DomainSwitcher domains={domains} current={current} compact={showEntities} />
            {current && entities && showEntities && (
                <>
                    <span className={styles.slash} aria-hidden>
                        /
                    </span>
                    <EntitySwitcher
                        domain={current}
                        items={entities.items}
                        currentId={entities.currentId}
                        currentName={entities.currentName}
                    />
                </>
            )}
            <div className={styles.actions}>
                <ThemeToggle compact />
                <UserMenu />
            </div>
        </header>
    );
}
